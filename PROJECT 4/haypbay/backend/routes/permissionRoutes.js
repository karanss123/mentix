import express from "express";
import Permission from "../models/Permission.js";
import { protect, permitPermissions } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js";

const router = express.Router();

// ✅ All permission routes need token + store context
router.use(protect, requireStore);

/* =========================
   CREATE PERMISSION
   required: roles:assign_permissions
========================= */
router.post("/", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const { key, description } = req.body;

    if (!key || !key.trim()) {
      return res.status(400).json({ message: "Permission key is required" });
    }

    const cleanKey = key.trim().toLowerCase();

    const exists = await Permission.findOne({
      storeId: req.storeId,
      key: cleanKey,
      isActive: true,
    });

    if (exists) {
      return res.status(400).json({ message: "Permission already exists" });
    }

    const permission = await Permission.create({
      storeId: req.storeId, // ✅ MUST
      key: cleanKey,
      description: (description || "").trim(),
      isActive: true,
      deletedAt: null,
    });

    return res.status(201).json(permission);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Permission already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   ✅ IMPORTANT: static routes first
========================= */

/* GET DELETED PERMISSIONS */
router.get("/deleted/list", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const permissions = await Permission.find({
      storeId: req.storeId,
      isActive: false,
    }).sort({ key: 1 });

    return res.json(permissions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* RESTORE PERMISSION */
router.put("/restore/:id", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      storeId: req.storeId,
    });

    if (!permission) return res.status(404).json({ message: "Permission not found" });

    const exists = await Permission.findOne({
      storeId: req.storeId,
      key: permission.key,
      isActive: true,
    });

    if (exists) {
      return res.status(400).json({
        message: "Active permission with same key already exists",
      });
    }

    permission.isActive = true;
    permission.deletedAt = null;
    await permission.save();

    return res.json({ message: "Permission restored ✅", permission });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Active permission with same key already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
});

/* PERMANENT DELETE */
router.delete("/permanent/:id", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      storeId: req.storeId,
    });

    if (!permission) return res.status(404).json({ message: "Permission not found" });

    await Permission.deleteOne({ _id: permission._id, storeId: req.storeId });

    return res.json({ message: "Permission permanently deleted 🗑️" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET ALL ACTIVE PERMISSIONS
========================= */
router.get("/", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const permissions = await Permission.find({
      storeId: req.storeId,
      isActive: true,
    }).sort({ key: 1 });

    return res.json(permissions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE PERMISSION
========================= */
router.put("/:id", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const { key, description } = req.body;

    const permission = await Permission.findOne({
      _id: req.params.id,
      storeId: req.storeId,
    });

    if (!permission) return res.status(404).json({ message: "Permission not found" });

    if (key !== undefined) {
      if (!key || !key.trim()) {
        return res.status(400).json({ message: "Permission key required" });
      }

      const cleanKey = key.trim().toLowerCase();

      const dup = await Permission.findOne({
        _id: { $ne: req.params.id },
        storeId: req.storeId,
        key: cleanKey,
        isActive: true,
      });

      if (dup) {
        return res.status(400).json({ message: "Permission key already exists" });
      }

      permission.key = cleanKey;
    }

    if (description !== undefined) {
      permission.description = (description || "").trim();
    }

    await permission.save();
    return res.json(permission);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Permission key already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   SOFT DELETE PERMISSION
========================= */
router.delete("/:id", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      storeId: req.storeId,
    });

    if (!permission) return res.status(404).json({ message: "Permission not found" });

    permission.isActive = false;
    permission.deletedAt = new Date();
    await permission.save();

    return res.json({ message: "Permission soft deleted ✅" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;