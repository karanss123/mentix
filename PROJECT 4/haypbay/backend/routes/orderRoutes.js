import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder, // ✅ ADD THIS
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js";

const router = express.Router();

/* USER */
router.post("/", protect, requireStore, createOrder);
router.get("/my", protect, requireStore, getMyOrders);
router.put("/:id/cancel", protect, requireStore, cancelMyOrder); // ✅ ADD THIS

/* ADMIN */
router.get("/", protect, requireStore, getAllOrders);
router.put("/:id/status", protect, requireStore, updateOrderStatus);

export default router;