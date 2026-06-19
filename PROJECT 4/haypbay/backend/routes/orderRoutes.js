import express from "express";
import {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js";

const router = express.Router();

/* USER */
router.post("/razorpay/create", protect, requireStore, createRazorpayOrder);
router.post("/razorpay/verify", protect, requireStore, verifyRazorpayPayment);

router.post("/", protect, requireStore, createOrder);
router.get("/my", protect, requireStore, getMyOrders);
router.put("/:id/cancel", protect, requireStore, cancelMyOrder);

/* ADMIN */
router.get("/", protect, requireStore, getAllOrders);
router.put("/:id/status", protect, requireStore, updateOrderStatus);

export default router;