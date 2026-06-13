import express from "express";
import {
  sendContactMessage,
  getContactMessages,
  markAsRead,
  deleteMessage,
  replyToContact, // 🔥 add
} from "../controllers/contactController.js";

import { protect } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js";

const router = express.Router();

/* ================= USER ================= */
router.post("/send", sendContactMessage);

/* ================= ADMIN ================= */
router.get("/", protect, requireStore, getContactMessages);

router.put("/:id/read", protect, requireStore, markAsRead);

router.post(
  "/:id/reply",
  protect,
  requireStore,
  replyToContact // 🔥 NEW ROUTE
);

router.delete("/:id", protect, requireStore, deleteMessage);

export default router;