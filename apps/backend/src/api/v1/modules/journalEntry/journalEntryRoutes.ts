import express, { Router } from "express";
import { journalEntryController } from "./journalEntryController.js";
import {
  requireAuth,
  requirePermission,
} from "../../shared/middleware/auth.middleware.js";
import { Action, Resource } from "../../shared/auth/permissions.js";

const journalEntryRoutes: Router = express.Router();

// Apply auth middleware to all routes
journalEntryRoutes.use(requireAuth);

// Get all journal entries for the company
journalEntryRoutes.get(
  "/",
  requirePermission(Resource.journalEntry, Action.read),
  journalEntryController.getAllJournalEntries,
);

// Get journal entries by date range
journalEntryRoutes.get(
  "/date-range",
  requirePermission(Resource.journalEntry, Action.read),
  journalEntryController.getByDateRange,
);

// Get journal entries by type
journalEntryRoutes.get(
  "/type/:type",
  requirePermission(Resource.journalEntry, Action.read),
  journalEntryController.getByType,
);

// Get journal entries by status
journalEntryRoutes.get(
  "/status/:status",
  requirePermission(Resource.journalEntry, Action.read),
  journalEntryController.getByStatus,
);

// Create new manual journal entry
journalEntryRoutes.post(
  "/",
  requirePermission(Resource.journalEntry, Action.create),
  journalEntryController.createJournalEntry,
);

// Get single journal entry
journalEntryRoutes.get(
  "/:id",
  requirePermission(Resource.journalEntry, Action.read),
  journalEntryController.getJournalEntryById,
);

// Update journal entry (draft only)
journalEntryRoutes.put(
  "/:id",
  requirePermission(Resource.journalEntry, Action.update),
  journalEntryController.updateJournalEntry,
);

// Delete journal entry (draft only)
journalEntryRoutes.delete(
  "/:id",
  requirePermission(Resource.journalEntry, Action.delete),
  journalEntryController.deleteJournalEntry,
);

// Post journal entry (change status from draft to posted)
journalEntryRoutes.post(
  "/:id/post",
  requirePermission(Resource.journalEntry, Action.update),
  journalEntryController.postJournalEntry,
);

// Void journal entry (reverse the entry)
journalEntryRoutes.post(
  "/:id/void",
  requirePermission(Resource.journalEntry, Action.update),
  journalEntryController.voidJournalEntry,
);

export default journalEntryRoutes;
