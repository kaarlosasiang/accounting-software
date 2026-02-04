import express, { Router } from "express";
import { journalEntryController } from "./journalEntryController.js";
import { requireAuth } from "../../shared/middleware/auth.middleware.js";

const journalEntryRoutes: Router = express.Router();

// Apply auth middleware to all routes
journalEntryRoutes.use(requireAuth);

// Get all journal entries for the company
journalEntryRoutes.get("/", journalEntryController.getAllJournalEntries);

// Get journal entries by date range
journalEntryRoutes.get("/date-range", journalEntryController.getByDateRange);

// Get journal entries by type
journalEntryRoutes.get("/type/:type", journalEntryController.getByType);

// Get journal entries by status
journalEntryRoutes.get("/status/:status", journalEntryController.getByStatus);

// Create new manual journal entry
journalEntryRoutes.post("/", journalEntryController.createJournalEntry);

// Get single journal entry
journalEntryRoutes.get("/:id", journalEntryController.getJournalEntryById);

// Update journal entry (draft only)
journalEntryRoutes.put("/:id", journalEntryController.updateJournalEntry);

// Delete journal entry (draft only)
journalEntryRoutes.delete("/:id", journalEntryController.deleteJournalEntry);

// Post journal entry (change status from draft to posted)
journalEntryRoutes.post("/:id/post", journalEntryController.postJournalEntry);

// Void journal entry (reverse the entry)
journalEntryRoutes.post("/:id/void", journalEntryController.voidJournalEntry);

export default journalEntryRoutes;
