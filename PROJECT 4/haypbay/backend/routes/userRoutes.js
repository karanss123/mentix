import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import requireStore from "../middleware/requireStore.js";
import { protect } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ✅ Every user route requires login + store header
router.use(protect, requireStore);

/* =========================
   GET logged-in user profile
========================= */
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id, storeId: req.storeId })
      .select("-password")
      .populate("role", "name");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE logged-in user profile
   (name only recommended)
========================= */
router.put("/profile", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id, storeId: req.storeId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ message: "Name is required" });
      user.name = name;
    }

    // ⚠️ Email update optional: keep if you really want it
    // if (req.body.email !== undefined) { ... store-wise duplicate check ... }

    await user.save();

    const safe = await User.findOne({ _id: user._id, storeId: req.storeId })
      .select("-password")
      .populate("role", "name");

    return res.json({ message: "Profile updated successfully", user: safe });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    }
    return res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE ANY USER ROLE (Admin Panel)
   PUT /api/users/:id/role
   Body: { roleId: "<ROLE_OBJECT_ID>" } OR { roleName: "admin" }
========================= */
router.put("/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, roleName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    let roleDoc = null;

    if (roleId) {
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        return res.status(400).json({ message: "Invalid role id" });
      }
      roleDoc = await Role.findOne({
        _id: roleId,
        storeId: req.storeId,
        isActive: true,
      });
    } else {
      const cleanName = String(roleName || "").trim().toLowerCase();
      if (!cleanName) return res.status(400).json({ message: "roleId or roleName is required" });

      roleDoc = await Role.findOne({
        name: cleanName,
        storeId: req.storeId,
        isActive: true,
      });
    }

    if (!roleDoc) return res.status(404).json({ message: "Role not found for this store" });

    const user = await User.findOne({ _id: id, storeId: req.storeId }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = roleDoc._id; // ✅ ObjectId only (matches schema)
    await user.save();

    const updated = await User.findOne({ _id: user._id, storeId: req.storeId })
      .select("-password")
      .populate("role", "name");

    return res.json({ message: "User role updated successfully", user: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;