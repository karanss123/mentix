import express from "express";
import { protect, permitPermissions } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getHomeProducts,
  getHomeProductsByCategory,
  getSingleProduct,
  searchProducts,
  searchHomeProducts,
} from "../controllers/productController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */

// all home/store products
router.get("/home/:storeId", getHomeProducts);

// search home/store products
router.get("/home/:storeId/search", searchHomeProducts);

// category wise home/store products
router.get("/home/:storeId/category/:categoryName", getHomeProductsByCategory);

// single public product
router.get("/public/:id", getSingleProduct);

/* =========================
   PROTECTED ROUTES
========================= */

// all admin/store products
router.get(
  "/",
  protect,
  requireStore,
  permitPermissions(["products:view"]),
  getProducts
);

// admin/store search products
router.get(
  "/search",
  protect,
  requireStore,
  permitPermissions(["products:view"]),
  searchProducts
);

// single protected product
router.get("/:id", protect, requireStore, getProductById);

// create product
router.post(
  "/",
  protect,
  requireStore,
  permitPermissions(["products:create"]),
  upload.array("images", 5),
  createProduct
);

// update product
router.put(
  "/:id",
  protect,
  requireStore,
  permitPermissions(["products:update"]),
  upload.array("images", 5),
  updateProduct
);

// delete product
router.delete(
  "/:id",
  protect,
  requireStore,
  permitPermissions(["products:delete"]),
  deleteProduct
);

export default router;