import mongoose, { ClientSession } from "mongoose";

import logger from "../../config/logger.js";
import { Bill } from "../../models/Bill.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { InventoryTransaction } from "../../models/InventoryTransaction.js";
import { Supplier } from "../../models/Supplier.js";
import { JournalEntryService } from "../../services/journalEntryService.js";
import { OPEN_DOCUMENT_STATUSES } from "../../shared/helpers/documentTotals.js";
import { escapeRegex } from "../../shared/helpers/escapeRegex.js";
import { round2 } from "../../shared/helpers/money.js";
import { BillStatus, IBillDocument } from "../../shared/interface/IBill.js";
import {
  InventoryReferenceType,
  InventoryTransactionType,
} from "../../shared/interface/IInventoryTransaction.js";

/** Fields a client may set when creating or editing a draft bill. */
const DRAFT_EDITABLE_FIELDS = [
  "supplierId",
  "billDate",
  "dueDate",
  "lineItems",
  "taxRate",
  "discount",
  "notes",
  "terms",
] as const;

/** Fields that may change on a posted (approved) bill. */
const POSTED_EDITABLE_FIELDS = ["dueDate", "notes", "terms"] as const;

const LINE_ITEM_FIELDS = [
  "description",
  "quantity",
  "unitPrice",
  "accountId",
  "inventoryItemId",
] as const;

const pick = <T extends string>(
  source: Record<string, any>,
  fields: readonly T[],
): Partial<Record<T, any>> => {
  const result: Partial<Record<T, any>> = {};
  for (const field of fields) {
    if (source[field] !== undefined) result[field] = source[field];
  }
  return result;
};

const sanitizeBillInput = (
  data: Record<string, any>,
  fields: readonly string[],
) => {
  const clean = pick(data ?? {}, fields);
  if (Array.isArray(clean.lineItems)) {
    clean.lineItems = clean.lineItems.map((item: Record<string, any>) =>
      pick(item ?? {}, LINE_ITEM_FIELDS),
    );
  }
  return clean;
};

const wantsPosting = (status: unknown) =>
  typeof status === "string" &&
  status !== BillStatus.DRAFT &&
  status !== BillStatus.VOID;

/**
 * Atomically adjust a supplier's balance (company-scoped, null-safe).
 */
async function adjustSupplierBalance(
  companyId: mongoose.Types.ObjectId | string,
  supplierId: any,
  amount: number,
  session: ClientSession,
) {
  await Supplier.updateOne(
    { _id: supplierId?._id ?? supplierId, companyId },
    [
      {
        $set: {
          currentBalance: {
            $round: [
              { $add: [{ $ifNull: ["$currentBalance", 0] }, round2(amount)] },
              2,
            ],
          },
        },
      },
    ],
    { session, updatePipeline: true },
  );
}

/**
 * Bill Service
 * Handles all business logic for bills (purchases from suppliers)
 */
export const billService = {
  /**
   * Get all bills for a company
   */
  async getAllBills(companyId: string) {
    try {
      const bills = await Bill.find({ companyId })
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ createdAt: -1 });

      return bills;
    } catch (error) {
      logger.logError(error as Error, { operation: "getAllBills" });
      throw error;
    }
  },

  /**
   * Get bill by ID
   */
  async getBillById(companyId: string, billId: string) {
    try {
      const bill = await Bill.findOne({
        _id: billId,
        companyId,
      })
        .populate(
          "supplierId",
          "supplierName displayName email phone address currentBalance",
        )
        .populate("lineItems.accountId", "accountCode accountName")
        .populate("lineItems.inventoryItemId", "itemCode itemName unit")
        .populate("createdBy", "first_name last_name email");

      if (!bill) {
        throw new Error("Bill not found");
      }

      return bill;
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillById" });
      throw error;
    }
  },

  /**
   * Create new bill. Totals are always computed server-side from the line
   * items; a non-draft status posts the bill in the same transaction.
   */
  async createBill(companyId: string, userId: string, billData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const supplier = await Supplier.findOne({
        _id: billData?.supplierId,
        companyId,
      }).session(session);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      const bill = new Bill({
        ...sanitizeBillInput(billData, DRAFT_EDITABLE_FIELDS),
        companyId,
        createdBy: userId,
        status: BillStatus.DRAFT,
        amountPaid: 0,
      });

      await bill.save({ session });

      if (wantsPosting(billData?.status)) {
        await this.postBill(bill, userId, session);
      }

      await session.commitTransaction();

      return await Bill.findById(bill._id)
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email");
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "createBill" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update bill.
   * - Drafts: any editable field; may be posted by sending a non-draft status.
   * - Posted bills: only due date, notes and terms.
   */
  async updateBill(
    companyId: string,
    billId: string,
    updateData: any,
    userId?: string,
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill = await Bill.findOne({
        _id: billId,
        companyId,
      }).session(session);

      if (!bill) {
        throw new Error("Bill not found");
      }

      if (bill.status === BillStatus.PAID || bill.status === BillStatus.VOID) {
        throw new Error(`Cannot update ${bill.status.toLowerCase()} bill`);
      }

      const isDraft = bill.status === BillStatus.DRAFT;

      if (isDraft) {
        const changes = sanitizeBillInput(updateData, DRAFT_EDITABLE_FIELDS);
        if (
          changes.supplierId &&
          String(changes.supplierId) !== String(bill.supplierId)
        ) {
          const supplier = await Supplier.findOne({
            _id: changes.supplierId,
            companyId,
          }).session(session);
          if (!supplier) throw new Error("Supplier not found");
        }
        Object.assign(bill, changes);
      } else {
        const blocked = Object.keys(updateData ?? {}).filter(
          (key) =>
            (DRAFT_EDITABLE_FIELDS as readonly string[]).includes(key) &&
            !(POSTED_EDITABLE_FIELDS as readonly string[]).includes(key) &&
            JSON.stringify(updateData[key]) !==
              JSON.stringify((bill as any)[key]),
        );
        if (blocked.length > 0) {
          throw new Error(
            `Cannot change ${blocked.join(", ")} on an approved bill. Void it and enter a new bill instead.`,
          );
        }
        Object.assign(
          bill,
          sanitizeBillInput(updateData, POSTED_EDITABLE_FIELDS),
        );
      }

      await bill.save({ session });

      if (isDraft && wantsPosting(updateData?.status)) {
        await this.postBill(bill, userId ?? String(bill.createdBy), session);
      }

      await session.commitTransaction();

      return await Bill.findById(bill._id)
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email");
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "updateBill" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Post a draft bill: receive inventory, raise the supplier balance and
   * write the journal entry. Idempotent.
   */
  async postBill(bill: IBillDocument, userId: string, session: ClientSession) {
    if (bill.journalEntryId) {
      return bill;
    }
    if (bill.status === BillStatus.VOID) {
      throw new Error("Cannot post a void bill");
    }

    bill.status = BillStatus.SENT;
    await bill.save({ session });

    await this.processBillItems(bill, session);
    await adjustSupplierBalance(
      bill.companyId,
      bill.supplierId,
      bill.totalAmount,
      session,
    );

    bill.journalEntryId = await JournalEntryService.createBillJournalEntry(
      bill,
      userId,
      session,
    );
    await bill.save({ session });

    return bill;
  },

  /**
   * Delete bill (only DRAFT bills)
   */
  async deleteBill(companyId: string, billId: string) {
    try {
      const bill = await Bill.findOne({
        _id: billId,
        companyId,
      });

      if (!bill) {
        throw new Error("Bill not found");
      }

      if (bill.status !== BillStatus.DRAFT || bill.journalEntryId) {
        throw new Error("Only draft bills can be deleted. Use void instead.");
      }

      await bill.deleteOne();
      return { message: "Bill deleted successfully" };
    } catch (error) {
      logger.logError(error as Error, { operation: "deleteBill" });
      throw error;
    }
  },

  /**
   * Void bill. Reverses the journal entry, supplier balance and inventory —
   * but only if the bill had actually been posted.
   */
  async voidBill(companyId: string, billId: string, userId?: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill = (await Bill.findOne({
        _id: billId,
        companyId,
      }).session(session)) as IBillDocument | null;

      if (!bill) {
        throw new Error("Bill not found");
      }

      const wasPosted =
        bill.status !== BillStatus.DRAFT || !!bill.journalEntryId;

      bill.void();
      await bill.save({ session });

      if (wasPosted) {
        if (bill.journalEntryId) {
          await JournalEntryService.reverseEntry({
            companyId,
            journalEntryId: bill.journalEntryId,
            userId: userId ?? String(bill.createdBy),
            reason: `Bill ${bill.billNumber} voided`,
            session,
          });
        }

        await adjustSupplierBalance(
          bill.companyId,
          bill.supplierId,
          -bill.balanceDue,
          session,
        );
        await this.reverseBillItems(bill, session);
      }

      await session.commitTransaction();

      return bill;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "voidBill" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get bills by supplier
   */
  async getBillsBySupplier(companyId: string, supplierId: string) {
    try {
      const bills = await Bill.find({
        companyId,
        supplierId,
      })
        .populate("createdBy", "first_name last_name email")
        .sort({ createdAt: -1 });

      return bills;
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillsBySupplier" });
      throw error;
    }
  },

  /**
   * Get bills by status
   */
  async getBillsByStatus(companyId: string, status: BillStatus) {
    try {
      const bills = await Bill.find({
        companyId,
        status,
      })
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ createdAt: -1 });

      return bills;
    } catch (error) {
      logger.logError(error as Error, { operation: "getBillsByStatus" });
      throw error;
    }
  },

  /**
   * Get overdue bills (any open bill past its due date)
   */
  async getOverdueBills(companyId: string) {
    try {
      const bills = await Bill.find({
        companyId,
        status: { $in: OPEN_DOCUMENT_STATUSES },
        dueDate: { $lt: new Date() },
      })
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ dueDate: 1 });

      return bills;
    } catch (error) {
      logger.logError(error as Error, { operation: "getOverdueBills" });
      throw error;
    }
  },

  /**
   * Search bills by bill number or supplier
   */
  async searchBills(companyId: string, searchTerm: string) {
    try {
      const safeTerm = escapeRegex(searchTerm);
      const suppliers = await Supplier.find({
        companyId,
        $or: [
          { supplierName: { $regex: safeTerm, $options: "i" } },
          { displayName: { $regex: safeTerm, $options: "i" } },
          { email: { $regex: safeTerm, $options: "i" } },
        ],
      }).select("_id");

      const supplierIds = suppliers.map((s) => s._id);

      const bills = await Bill.find({
        companyId,
        $or: [
          { billNumber: { $regex: safeTerm, $options: "i" } },
          { supplierId: { $in: supplierIds } },
        ],
      })
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email")
        .sort({ createdAt: -1 });

      return bills;
    } catch (error) {
      logger.logError(error as Error, { operation: "searchBills" });
      throw error;
    }
  },

  /**
   * Process bill items (increase inventory when bill is posted)
   */
  async processBillItems(bill: any, session: ClientSession) {
    for (const lineItem of bill.lineItems) {
      if (!lineItem.inventoryItemId) continue;

      const inventoryItem = await InventoryItem.findOne({
        _id: lineItem.inventoryItemId,
        companyId: bill.companyId,
      }).session(session);

      if (!inventoryItem) {
        throw new Error(
          `Inventory item not found: ${lineItem.inventoryItemId}`,
        );
      }

      if (inventoryItem.itemType !== "Product") continue;

      inventoryItem.quantityOnHand += lineItem.quantity;
      await inventoryItem.save({ session });

      await new InventoryTransaction({
        companyId: bill.companyId,
        inventoryItemId: lineItem.inventoryItemId,
        transactionType: InventoryTransactionType.PURCHASE,
        transactionDate: bill.billDate ?? bill.createdAt ?? new Date(),
        quantityIn: lineItem.quantity,
        quantityOut: 0,
        unitCost: lineItem.unitPrice,
        totalValue: lineItem.amount,
        balanceAfter: inventoryItem.quantityOnHand,
        referenceType: InventoryReferenceType.BILL,
        referenceId: bill._id,
        notes: `Purchase from bill ${bill.billNumber}`,
        createdBy: bill.createdBy,
      }).save({ session });
    }
  },

  /**
   * Reverse bill items (decrease inventory when a posted bill is voided)
   */
  async reverseBillItems(bill: any, session: ClientSession) {
    for (const lineItem of bill.lineItems) {
      if (!lineItem.inventoryItemId) continue;

      const inventoryItem = await InventoryItem.findOne({
        _id: lineItem.inventoryItemId,
        companyId: bill.companyId,
      }).session(session);

      if (!inventoryItem || inventoryItem.itemType !== "Product") continue;

      inventoryItem.quantityOnHand -= lineItem.quantity;
      if (inventoryItem.quantityOnHand < 0) {
        logger.warn(
          `Negative inventory after reversing bill: Item ${inventoryItem.sku}`,
        );
      }
      await inventoryItem.save({ session });

      await new InventoryTransaction({
        companyId: bill.companyId,
        inventoryItemId: lineItem.inventoryItemId,
        transactionType: InventoryTransactionType.ADJUSTMENT,
        transactionDate: new Date(),
        quantityIn: 0,
        quantityOut: lineItem.quantity,
        unitCost: lineItem.unitPrice,
        totalValue: lineItem.amount,
        balanceAfter: inventoryItem.quantityOnHand,
        referenceType: InventoryReferenceType.BILL,
        referenceId: bill._id,
        notes: `Reversal of bill ${bill.billNumber} (voided)`,
        createdBy: bill.createdBy,
      }).save({ session });
    }
  },

  /**
   * Approve bill (posts a draft bill: inventory, supplier balance, journal
   * entry). Approving an already-posted bill is a no-op.
   */
  async approveBill(companyId: string, billId: string, userId?: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill = (await Bill.findOne({
        _id: billId,
        companyId,
      }).session(session)) as IBillDocument | null;

      if (!bill) {
        throw new Error("Bill not found");
      }
      if (bill.status === BillStatus.VOID) {
        throw new Error("Cannot approve voided bill");
      }
      if (bill.status === BillStatus.PAID) {
        throw new Error("Bill is already paid");
      }

      if (bill.status === BillStatus.DRAFT) {
        await this.postBill(bill, userId ?? String(bill.createdBy), session);
      }

      await session.commitTransaction();

      return await Bill.findById(bill._id)
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email");
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      logger.logError(error as Error, { operation: "approveBill" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Get payment history for a bill
   */
  async getBillPayments(companyId: string, billId: string) {
    try {
      const { Payment } = await import("../../models/Payment.js");

      const payments = await Payment.find({
        companyId,
        "allocations.documentId": billId,
        "allocations.documentType": "BILL",
      })
        .populate("supplierId", "supplierName email")
        .populate("bankAccountId", "accountCode accountName")
        .populate("createdBy", "first_name last_name email")
        .sort({ paymentDate: -1 });

      return payments;
    } catch (error) {
      logger.logError(error as Error, {
        operation: "getBillPayments",
        companyId,
        billId,
      });
      throw error;
    }
  },
};
