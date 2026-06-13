import express from "express";
import Role from "../models/Role.js";
import User from "../models/User.js";
import { protect, permitPermissions } from "../middleware/authMiddleware.js";
import requireStore from "../middleware/requireStore.js"; // ✅ ADD

const router = express.Router();

// ✅ Apply store context to all role routes
router.use(protect, requireStore); // ✅ token + x-store-id required for everything below

/* =========================
   CREATE ROLE
   required: roles:create
========================= */
router.post("/", permitPermissions(["roles:create"]), async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const cleanName = name.trim().toLowerCase();
    const storeId = req.storeId;

    const exists = await Role.findOne({ storeId, name: cleanName, isActive: true });
    if (exists) return res.status(400).json({ message: "Role already exists" });

    const role = await Role.create({
      storeId, // ✅ MUST
      name: cleanName,
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    const created = await Role.findOne({ _id: role._id, storeId }).populate(
      "permissions",
      "key description"
    );

    return res.status(201).json(created);
  } catch (err) {
    if (err?.code === 11000) return res.status(400).json({ message: "Role already exists" });
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   ✅ IMPORTANT: static routes first
========================= */

/* GET DELETED ROLES */
router.get("/deleted/list", permitPermissions(["roles:view"]), async (req, res) => {
  try {
    const roles = await Role.find({ storeId: req.storeId, isActive: false })
      .populate("permissions", "key description")
      .sort({ deletedAt: -1 });

    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET ROLES
   required: roles:view
   ?all=true -> active + deleted
========================= */
router.get("/", permitPermissions(["roles:view"]), async (req, res) => {
  try {
    const all = req.query.all === "true";
    const storeId = req.storeId;

    const filter = all
      ? { storeId }
      : { storeId, isActive: true };

    const roles = await Role.find(filter)
      .populate("permissions", "key description")
      .sort({ createdAt: 1 });

    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* RESTORE ROLE */
router.put("/restore/:id", permitPermissions(["roles:update"]), async (req, res) => {
  try {
    const storeId = req.storeId;

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role) return res.status(404).json({ message: "Role not found" });

    const exists = await Role.findOne({ storeId, name: role.name, isActive: true });
    if (exists) {
      return res.status(400).json({
        message: "Cannot restore. An active role with same name already exists.",
      });
    }

    role.isActive = true;
    role.deletedAt = null;
    await role.save();

    const updated = await Role.findOne({ _id: role._id, storeId }).populate(
      "permissions",
      "key description"
    );
    return res.json({ message: "Role restored successfully", role: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* PERMANENT DELETE ROLE */
router.delete("/permanent/:id", permitPermissions(["roles:delete"]), async (req, res) => {
  try {
    const storeId = req.storeId;

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role) return res.status(404).json({ message: "Role not found" });

    // ✅ recommended: store-wise users count (if User has storeId)
    const usedCount = await User.countDocuments({ role: role._id, storeId });
    // if User doesn't have storeId then keep your old query

    if (usedCount > 0) {
      return res.status(400).json({
        message: `Cannot permanently delete. This role is assigned to ${usedCount} user(s).`,
      });
    }

    await Role.deleteOne({ _id: role._id, storeId });
    return res.json({ message: "Role permanently deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   ASSIGN / UPDATE ROLE PERMISSIONS
========================= */
router.put("/:id/permissions", permitPermissions(["roles:assign_permissions"]), async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "permissions must be an array" });
    }

    const role = await Role.findOne({ _id: req.params.id, storeId: req.storeId });
    if (!role) return res.status(404).json({ message: "Role not found" });

    role.permissions = permissions;
    await role.save();

    const updated = await Role.findOne({ _id: role._id, storeId: req.storeId }).populate(
      "permissions",
      "key description"
    );
    return res.json({ message: "Permissions assigned ✅", role: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* GET SINGLE ROLE */
router.get("/:id", permitPermissions(["roles:view"]), async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, storeId: req.storeId }).populate(
      "permissions",
      "key description"
    );
    if (!role) return res.status(404).json({ message: "Role not found" });
    return res.json(role);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* UPDATE ROLE NAME ONLY */
router.put("/:id", permitPermissions(["roles:update"]), async (req, res) => {
  try {
    const { name } = req.body;

    const role = await Role.findOne({ _id: req.params.id, storeId: req.storeId });
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Role name is required" });
      }

      const cleanName = name.trim().toLowerCase();

      const dup = await Role.findOne({
        _id: { $ne: req.params.id },
        storeId: req.storeId,
        name: cleanName,
        isActive: true,
      });

      if (dup) return res.status(400).json({ message: "Role name already exists" });

      role.name = cleanName;
    }

    await role.save();

    const updated = await Role.findOne({ _id: role._id, storeId: req.storeId }).populate(
      "permissions",
      "key description"
    );
    return res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Role name already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
});

/* SOFT DELETE ROLE */
router.delete("/:id", permitPermissions(["roles:delete"]), async (req, res) => {
  try {
    const storeId = req.storeId;

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role) return res.status(404).json({ message: "Role not found" });

    const usedCount = await User.countDocuments({ role: role._id, storeId });
    if (usedCount > 0) {
      return res.status(400).json({
        message: `Cannot delete. This role is assigned to ${usedCount} user(s).`,
      });
    }

    role.isActive = false;
    role.deletedAt = new Date();
    await role.save();

    return res.json({ message: "Role soft deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;