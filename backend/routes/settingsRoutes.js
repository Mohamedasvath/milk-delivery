import express from "express";
import { getSettings, updateBusiness, updatePreferences } from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/profile", getSettings);
router.put("/business", updateBusiness);
router.put("/preferences", updatePreferences);

export default router;