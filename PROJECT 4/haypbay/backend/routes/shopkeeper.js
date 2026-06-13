import express from "express";
import { protect, permitPermissions } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Dashboard (permission based)
router.get(
  "/dashboard",
  protect,
  permitPermissions(["products:view"]), // ya custom: "shopkeeper:dashboard"
  (req, res) => {
    res.json({ message: `Welcome ${req.user.name}` });
  }
);

export default router;
