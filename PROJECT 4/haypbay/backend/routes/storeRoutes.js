import express from "express";
import {
  protect,
  superAdminOnly,
} from "../middleware/authMiddleware.js";

import requireStore from "../middleware/requireStore.js";

import {
  createStore,
  getStores,
  getCurrentStore,
  updateCurrentStore,
  updateStoreById,
  deleteStore,
} from "../controllers/storeController.js";

const router = express.Router();

/* =========================
   NORMAL STORE CONTEXT
========================= */
router.get("/current", protect, requireStore, getCurrentStore);
router.put("/current", protect, requireStore, updateCurrentStore);

/* =========================
   SUPERADMIN ONLY
========================= */
router.get("/", protect, superAdminOnly, getStores);
router.post("/", protect, superAdminOnly, createStore);
router.put("/:id", protect, superAdminOnly, updateStoreById);
router.delete("/:id", protect, superAdminOnly, deleteStore);

export default router;