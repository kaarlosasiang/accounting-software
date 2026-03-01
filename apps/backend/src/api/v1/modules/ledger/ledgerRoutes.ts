import express, { Router } from "express";
import { ledgerController } from "./ledgerController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const ledgerRoutes: Router = express.Router();

// Apply auth + read permission middleware to all ledger routes
ledgerRoutes.use(requireAuth);
ledgerRoutes.use(requirePermission(Resource.ledger, Action.read));

// Get all ledger entries for the company
ledgerRoutes.get("/", ledgerController.getAllLedgerEntries);

// Get general ledger (grouped by account)
ledgerRoutes.get("/general", ledgerController.getGeneralLedger);

// Get ledger entries by account
ledgerRoutes.get("/account/:accountId", ledgerController.getByAccount);

// Get ledger entries by journal entry
ledgerRoutes.get(
  "/journal-entry/:journalEntryId",
  ledgerController.getByJournalEntry,
);

// Get ledger entries by date range
ledgerRoutes.get("/date-range", ledgerController.getByDateRange);

// Get account balance
ledgerRoutes.get(
  "/account/:accountId/balance",
  ledgerController.getAccountBalance,
);

// Get trial balance
ledgerRoutes.get("/trial-balance", ledgerController.getTrialBalance);

export default ledgerRoutes;
