// backend/routes/adminRoutes.js
import express from "express";
import {
  protect,
  permitRoles,
  permitPermissions,
} from "../middleware/authMiddleware.js";

import requireStore from "../middleware/requireStore.js"; // ✅ ADD THIS

import {
  adminDashboard,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/adminController.js";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

/* ================= DASHBOARD ================= */
router.get(
  "/dashboard",
  protect,
  requireStore, // ✅ ADD
  permitRoles(["admin", "shopkeeper"]),
  adminDashboard
);

/* ================= USERS ================= */
router.get(
  "/users",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["users:view"]),
  getAllUsers
);

router.put(
  "/users/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["users:update"]),
  updateUser
);

router.delete(
  "/users/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["users:delete"]),
  deleteUser
);

/* ================= CATEGORIES ================= */
router.get(
  "/categories",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["categories:view"]),
  getCategories
);

router.post(
  "/categories",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["categories:create"]),
  createCategory
);

router.put(
  "/categories/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["categories:update"]),
  updateCategory
);

router.delete(
  "/categories/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["categories:delete"]),
  deleteCategory
);

/* ================= PRODUCTS ================= */
router.get(
  "/products",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["products:view"]),
  getProducts
);

router.get(
  "/products/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["products:view"]),
  getProducts
);

router.post(
  "/products",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["products:create"]),
  createProduct
);

router.put(
  "/products/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["products:update"]),
  updateProduct
);

router.delete(
  "/products/:id",
  protect,
  requireStore, // ✅ ADD
  permitPermissions(["products:delete"]),
  deleteProduct
);

export default router;