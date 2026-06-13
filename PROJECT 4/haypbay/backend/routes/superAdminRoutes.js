import express from "express";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";
import { createStoreAdmin } from "../controllers/superAdminController.js";

const router = express.Router();

// ✅ SuperAdmin only
router.post("/create-store-admin", protect, superAdminOnly, createStoreAdmin);

export default router;