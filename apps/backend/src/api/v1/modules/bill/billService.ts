import mongoose from "mongoose";
import { Bill } from "../../models/Bill.js";
import { Supplier } from "../../models/Supplier.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { InventoryTransaction } from "../../models/InventoryTransaction.js";
import { BillStatus, IBillDocument } from "../../shared/interface/IBill.js";
import logger from "../../config/logger.js";
import { JournalEntryService } from "../../services/journalEntryService.js";

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
   * Create new bill
   */
  async createBill(companyId: string, userId: string, billData: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate supplier exists
      const supplier = await Supplier.findOne({
        _id: billData.supplierId,
        companyId,
      }).session(session);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      // Generate simple bill number (temporary solution)
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const sequence = timestamp % 10000;
      const billNumber = `BILL-${year}-${sequence.toString().padStart(4, "0")}`;

      // Calculate amounts if not provided
      const subtotal =
        billData.subtotal ??
        billData.lineItems.reduce(
          (sum: number, item: any) => sum + item.quantity * item.unitPrice,
          0,
        );

      const taxRate = billData.taxRate ?? 0;
      const taxAmount = subtotal * (taxRate / 100);
      const discount = billData.discount ?? 0;
      const totalAmount =
        billData.totalAmount ?? subtotal + taxAmount - discount;
      const amountPaid = billData.amountPaid ?? 0;
      const balanceDue = billData.balanceDue ?? totalAmount - amountPaid;

      // Create bill
      const bill = new Bill({
        ...billData,
        companyId,
        billNumber,
        createdBy: userId,
        status: BillStatus.DRAFT,
        subtotal,
        taxAmount,
        totalAmount,
        balanceDue,
        amountPaid,
        discount,
      });

      await bill.save({ session });

      // If status is not DRAFT, process inventory, update supplier balance, and create journal entry
      if (billData.status && billData.status !== BillStatus.DRAFT) {
        await this.processBillItems(bill, session);
        await this.updateSupplierBalance(supplier, bill.totalAmount, session);

        // Create automatic journal entry
        const journalEntryId = await JournalEntryService.createBillJournalEntry(
          bill,
          new mongoose.Types.ObjectId(userId),
        );
        bill.journalEntryId = journalEntryId;
        await bill.save({ session });
      }

      await session.commitTransaction();

      // Populate and return the created bill
      const populatedBill = await Bill.findById(bill._id)
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email");

      return populatedBill;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, { operation: "createBill" });
      throw error;
    } finally {
      session.endSession();
    }
  },

  /**
   * Update bill
   */
  async updateBill(companyId: string, billId: string, updateData: any) {
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

      // Cannot update paid or void bills
      if (bill.status === BillStatus.PAID || bill.status === BillStatus.VOID) {
        throw new Error(`Cannot update ${bill.status.toLowerCase()} bill`);
      }

      const oldStatus = bill.status;
      const oldTotal = bill.totalAmount;

      // Calculate amounts if line items are being updated
      if (updateData.lineItems) {
        const subtotal =
          updateData.subtotal ??
          updateData.lineItems.reduce(
            (sum: number, item: any) => sum + item.quantity * item.unitPrice,
            0,
          );

        const taxRate = updateData.taxRate ?? bill.taxRate ?? 0;
        const taxAmount = subtotal * (taxRate / 100);
        const discount = updateData.discount ?? bill.discount ?? 0;
        const totalAmount =
          updateData.totalAmount ?? subtotal + taxAmount - discount;
        const amountPaid = updateData.amountPaid ?? bill.amountPaid ?? 0;
        const balanceDue = updateData.balanceDue ?? totalAmount - amountPaid;

        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.totalAmount = totalAmount;
        updateData.balanceDue = balanceDue;
      }

      // Update bill fields
      Object.assign(bill, updateData);
      await bill.save({ session });

      // If status changed from DRAFT to active, process inventory and create journal entry
      if (oldStatus === BillStatus.DRAFT && bill.status !== BillStatus.DRAFT) {
        await this.processBillItems(bill, session);
        const supplier = await Supplier.findById(bill.supplierId).session(
          session,
        );
        if (supplier) {
          await this.updateSupplierBalance(supplier, bill.totalAmount, session);
        }

        // Create automatic journal entry
        const journalEntryId = await JournalEntryService.createBillJournalEntry(
          bill,
          bill.createdBy,
        );
        bill.journalEntryId = journalEntryId;
        await bill.save({ session });
      }

      // If total amount changed, update supplier balance
      if (oldTotal !== bill.totalAmount && oldStatus !== BillStatus.DRAFT) {
        const supplier = await Supplier.findById(bill.supplierId).session(
          session,
        );
        if (supplier) {
          const difference = bill.totalAmount - oldTotal;
          await this.updateSupplierBalance(supplier, difference, session);
        }
      }

      await session.commitTransaction();

      // Populate and return the updated bill
      const populatedBill = await Bill.findById(bill._id)
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email");

      return populatedBill;
    } catch (error) {
      await session.abortTransaction();
      logger.logError(error as Error, { operation: "updateBill" });
      throw error;
    } finally {
      session.endSession();
    }
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

      // Only allow deletion of DRAFT bills
      if (bill.status !== BillStatus.DRAFT) {
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
   * Void bill
   */
  async voidBill(companyId: string, billId: string) {
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

      // Use the model's void method
      await bill.void();
      await bill.save({ session });

      // Reverse supplier balance
      const supplier = await Supplier.findById(bill.supplierId).session(
        session,
      );
      if (supplier && bill.status !== BillStatus.DRAFT) {
        await this.updateSupplierBalance(supplier, -bill.balanceDue, session);
      }

      // Reverse inventory transactions
      await this.reverseBillItems(bill, session);

      await session.commitTransaction();

      return bill;
    } catch (error) {
      await session.abortTransaction();
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
   * Get overdue bills
   */
  async getOverdueBills(companyId: string) {
    try {
      const bills = await Bill.find({
        companyId,
        status: { $in: [BillStatus.SENT, BillStatus.PARTIAL] },
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
   * Search bills
   */
  async searchBills(companyId: string, searchTerm: string) {
    try {
      // First, find matching suppliers
      const suppliers = await Supplier.find({
        companyId,
        $or: [
          { supplierName: { $regex: searchTerm, $options: "i" } },
          { displayName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      }).select("_id");

      const supplierIds = suppliers.map((s) => s._id);

      // Search bills by bill number or supplier
      const bills = await Bill.find({
        companyId,
        $or: [{ supplierId: { $in: supplierIds } }],
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
   * Process bill items (increase inventory when bill is confirmed)
   */
  async processBillItems(bill: any, session: any) {
    try {
      for (const lineItem of bill.lineItems) {
        if (lineItem.inventoryItemId) {
          const inventoryItem = await InventoryItem.findById(
            lineItem.inventoryItemId,
          ).session(session);

          if (!inventoryItem) {
            throw new Error(
              `Inventory item not found: ${lineItem.inventoryItemId}`,
            );
          }

          // Increase inventory quantity (purchase increases stock)
          inventoryItem.quantityOnHand += lineItem.quantity;
          await inventoryItem.save({ session });

          // Record inventory transaction
          const transaction = new InventoryTransaction({
            companyId: bill.companyId,
            inventoryItemId: lineItem.inventoryItemId,
            transactionType: "PURCHASE",
            quantity: lineItem.quantity,
            unitCost: lineItem.unitPrice,
            totalCost: lineItem.amount,
            referenceType: "BILL",
            referenceId: bill._id,
            referenceNumber: bill.billNumber,
            transactionDate: bill.createdAt,
            notes: `Purchase from bill ${bill.billNumber}`,
          });

          await transaction.save({ session });
        }
      }
    } catch (error) {
      logger.logError(error as Error, { operation: "processBillItems" });
      throw error;
    }
  },

  /**
   * Reverse bill items (decrease inventory when bill is voided)
   */
  async reverseBillItems(bill: any, session: any) {
    try {
      for (const lineItem of bill.lineItems) {
        if (lineItem.inventoryItemId) {
          const inventoryItem = await InventoryItem.findById(
            lineItem.inventoryItemId,
          ).session(session);

          if (inventoryItem) {
            // Decrease inventory quantity
            inventoryItem.quantityOnHand -= lineItem.quantity;
            if (inventoryItem.quantityOnHand < 0) {
              logger.warn(
                `Negative inventory after reversing bill: Item ${inventoryItem.itemCode}`,
              );
            }
            await inventoryItem.save({ session });

            // Record reversal transaction
            const transaction = new InventoryTransaction({
              companyId: bill.companyId,
              inventoryItemId: lineItem.inventoryItemId,
              transactionType: "ADJUSTMENT",
              quantity: -lineItem.quantity,
              unitCost: lineItem.unitPrice,
              totalCost: -lineItem.amount,
              referenceType: "BILL",
              referenceId: bill._id,
              referenceNumber: bill.billNumber,
              transactionDate: new Date(),
              notes: `Reversal of bill ${bill.billNumber} (voided)`,
            });

            await transaction.save({ session });
          }
        }
      }
    } catch (error) {
      logger.logError(error as Error, { operation: "reverseBillItems" });
      throw error;
    }
  },

  /**
   * Update supplier balance
   */
  async updateSupplierBalance(supplier: any, amount: number, session: any) {
    try {
      supplier.currentBalance += amount;
      await supplier.save({ session });
    } catch (error) {
      logger.logError(error as Error, { operation: "updateSupplierBalance" });
      throw error;
    }
  },

  /**
   * Approve bill (similar to invoice send - activates the bill and creates journal entry)
   */
  async approveBill(companyId: string, billId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill = await Bill.findOne({
        _id: billId,
        companyId,
      })
        .populate("supplierId", "supplierName displayName email phone address")
        .session(session);

      if (!bill) {
        throw new Error("Bill not found");
      }

      // Cannot approve void bills
      if (bill.status === BillStatus.VOID) {
        throw new Error("Cannot approve voided bill");
      }

      // Cannot approve already paid bills
      if (bill.status === BillStatus.PAID) {
        throw new Error("Bill is already paid");
      }

      const supplier = bill.supplierId as any;
      const oldStatus = bill.status;

      // Update status to SENT if it's currently DRAFT
      if (bill.status === BillStatus.DRAFT) {
        bill.status = BillStatus.SENT;
        await bill.save({ session });

        // Process inventory and update supplier balance for newly approved bills
        await this.processBillItems(bill, session);
        await this.updateSupplierBalance(supplier, bill.totalAmount, session);

        // Create automatic journal entry for newly approved bill
        const journalEntryId = await JournalEntryService.createBillJournalEntry(
          bill,
          bill.createdBy,
        );
        bill.journalEntryId = journalEntryId;
        await bill.save({ session });
      }

      await session.commitTransaction();

      // Populate and return the updated bill
      const populatedBill = await Bill.findById(bill._id)
        .populate("supplierId", "supplierName displayName email")
        .populate("createdBy", "first_name last_name email");

      return populatedBill;
    } catch (error) {
      await session.abortTransaction();
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
