import express from "express";
import {
  getMilkEntries,
  getMilkEntryById,
  createMilkEntry,
  updateMilkEntry,
  deleteMilkEntry,
  getBulkSheetByDate
} from "../controllers/milkEntryController.js";

const router = express.Router();

// Base operations
router.get("/", getMilkEntries);
router.post("/", createMilkEntry);

// Bulk operational metrics (Must be declared before dynamic parameter ids)
router.get("/bulk-sheet", getBulkSheetByDate);

// Parametric record filtering routes
router.get("/:id", getMilkEntryById);
router.put("/:id", updateMilkEntry);
router.delete("/:id", deleteMilkEntry);

export default router;