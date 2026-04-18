import { Request, Response } from "express";
import mongoose from "mongoose";

import { authServer } from "../auth/betterAuth.js";
import { getCompanyId } from "../../shared/helpers/utils.js";
import logger from "../../config/logger.js";

// All models that store companyId-scoped data
import Account from "../../models/Account.js";
import { Invoice } from "../../models/Invoice.js";
import { Bill } from "../../models/Bill.js";
import { Customer } from "../../models/Customer.js";
import { Supplier } from "../../models/Supplier.js";
import { Payment } from "../../models/Payment.js";
import { JournalEntry } from "../../models/JournalEntry.js";
import { Ledger } from "../../models/Ledger.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { InventoryTransaction } from "../../models/InventoryTransaction.js";
import { Report } from "../../models/Report.js";
import { AccountingPeriod } from "../../models/AccountingPeriod.js";
import { CompanySettings } from "../../models/CompanySettings.js";
import { AuditLog } from "../../models/AuditLog.js";
import Role from "../../models/Role.js";
import MemberPermission from "../../models/MemberPermission.js";
import PendingInvitePermission from "../../models/PendingInvitePermission.js";

const SCOPED_MODELS = [
  Account,
  Invoice,
  Bill,
  Customer,
  Supplier,
  Payment,
  JournalEntry,
  Ledger,
  InventoryItem,
  InventoryTransaction,
  Report,
  AccountingPeriod,
  CompanySettings,
  AuditLog,
];

const companyController = {
  /**
   * DELETE /api/v1/company
   * Owner-only: delete the active organization and cascade-delete all its data.
   * Requires the caller to be the org owner (enforced by requirePermission).
   */
  deleteOrganization: async (req: Request, res: Response) => {
    const organizationId = getCompanyId(req);
    if (!organizationId) {
      return res
        .status(400)
        .json({ success: false, message: "No active organization" });
    }

    // Verify caller is owner via the session's org role
    const orgRole = (req.authSession as any)?.session
      ?.activeOrganizationRole as string | undefined;
    if (orgRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only the owner can delete an organization",
      });
    }

    const session = mongoose.startSession
      ? await mongoose.startSession()
      : null;
    try {
      if (session) session.startTransaction();

      const companyObjectId = new mongoose.Types.ObjectId(organizationId);

      // 1. Cascade-delete all companyId-scoped data
      await Promise.all(
        SCOPED_MODELS.map((Model) =>
          (Model as any).deleteMany({ companyId: companyObjectId }),
        ),
      );

      // 2. Delete org-scoped custom roles (companyId = ObjectId, system roles have null)
      await (Role as any).deleteMany({ companyId: companyObjectId });

      // 3. Delete member permissions and pending invite permissions scoped to this org
      await MemberPermission.deleteMany({ organizationId });
      await PendingInvitePermission.deleteMany({ organizationId });

      // 4. Delete the organization itself via Better-Auth
      await authServer.api.deleteOrganization({
        headers: req.headers as Record<string, string>,
        body: { organizationId },
      });

      if (session) await session.commitTransaction();

      logger.info("Organization deleted with full cascade", { organizationId });
      return res
        .status(200)
        .json({ success: true, message: "Organization deleted" });
    } catch (error) {
      if (session) await session.abortTransaction().catch(() => {});
      logger.logError(error as Error, {
        operation: "delete-organization",
        organizationId,
      });
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete organization" });
    } finally {
      if (session) session.endSession();
    }
  },
};

export default companyController;
