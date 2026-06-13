import express from "express";
import { protect, permitPermissions } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// ✅ Apply once for all routes in this router
router.use(protect, requireStore);

router.get("/", permitPermissions(["categories:view"]), getCategories);
router.post("/", permitPermissions(["categories:create"]), createCategory);
router.put("/:id", permitPermissions(["categories:update"]), updateCategory);
router.delete("/:id", permitPermissions(["categories:delete"]), deleteCategory);

export default router;