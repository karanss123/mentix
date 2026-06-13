import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";

/* ================= DASHBOARD ================= */
export const adminDashboard = async (req, res) => {
  try {
    const me = req.user;
    const roleName = (req.userRole || "").toLowerCase();

    const storeId = req.storeId;

    if (roleName === "admin") {
      const users = await User.find({
        $or: [
          { storeId },
          { exploredStores: { $elemMatch: { storeId } } },
        ],
        isDeleted: { $ne: true },
      })
        .populate("role", "name")
        .select("-password")
        .sort({ createdAt: -1 });

      return res.json({
        msg: `Welcome Admin ${me.name}`,
        user: me.name,
        role: roleName,
        users,
      });
    }

    if (roleName === "shopkeeper") {
      return res.json({
        msg: `Welcome Shopkeeper ${me.name}`,
        user: me.name,
        role: roleName,
      });
    }

    return res.json({
      msg: `Welcome ${me.name}`,
      user: me.name,
      role: roleName,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ msg: err.message });
  }
};

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  try {
    const storeId = req.storeId;

    // ✅ 1. staff / managed users for this store
    const staffUsers = await User.find({
      storeId,
      isDeleted: { $ne: true },
    })
      .populate("role", "name")
      .select("-password")
      .sort({ createdAt: -1 });

    // ✅ 2. customers who explored this store
    const exploredCustomers = await User.find({
      storeId: null,
      exploredStores: {
        $elemMatch: { storeId },
      },
      isDeleted: { $ne: true },
    })
      .populate("role", "name")
      .select("-password")
      .sort({ createdAt: -1 });

    // ✅ 3. merge without duplicates
    const map = new Map();

    [...staffUsers, ...exploredCustomers].forEach((u) => {
      map.set(String(u._id), u);
    });

    const users = Array.from(map.values());

    return res.json(users);
  } catch (err) {
    console.error("Get Users Error:", err);
    return res.status(500).json({ msg: err.message });
  }
};

/* ================= UPDATE USER ================= */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, roleId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    // ✅ can update only store-linked/staff user of this store
    const user = await User.findOne({ _id: id, storeId: req.storeId });

    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.isDeleted === true) {
      return res.status(400).json({ msg: "Cannot update: user is deleted" });
    }

    if (name !== undefined) {
      const cleanName = String(name || "").trim();
      if (!cleanName) {
        return res.status(400).json({ msg: "Name cannot be empty" });
      }
      user.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return res.status(400).json({ msg: "Email cannot be empty" });
      }

      const dup = await User.findOne({
        _id: { $ne: user._id },
        email: cleanEmail,
        isDeleted: { $ne: true },
      });

      if (dup) {
        return res.status(400).json({ msg: "Email already in use" });
      }

      user.email = cleanEmail;
    }

    const incomingRole = roleId ?? role;

    if (incomingRole !== undefined) {
      const incoming = String(incomingRole || "").trim();
      if (!incoming) {
        return res.status(400).json({ msg: "Role cannot be empty" });
      }

      let roleDoc = null;

      if (mongoose.Types.ObjectId.isValid(incoming)) {
        roleDoc = await Role.findOne({
          _id: incoming,
          storeId: req.storeId,
          isActive: true,
        });
      } else {
        roleDoc = await Role.findOne({
          name: incoming.toLowerCase(),
          storeId: req.storeId,
          isActive: true,
        });
      }

      if (!roleDoc) {
        return res.status(400).json({ msg: "Invalid role provided" });
      }

      // ✅ customer ko staff me convert mat karo by mistake
      if (String(user.storeId || "") === "") {
        return res.status(400).json({ msg: "Customer role cannot be changed from this panel" });
      }

      user.role = roleDoc._id;
    }

    await user.save();

    const updated = await User.findOne({ _id: user._id, storeId: req.storeId })
      .populate("role", "name")
      .select("-password");

    return res.json({
      msg: "User updated successfully ✅",
      user: updated,
    });
  } catch (err) {
    console.error("Update User Error:", err);
    return res.status(500).json({ msg: err.message });
  }
};

/* ================= DELETE USER (SOFT) ================= */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid user id" });
    }

    // ✅ allow delete only for store-linked/staff user of this store
    const user = await User.findOne({ _id: id, storeId: req.storeId });

    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.isDeleted === true) {
      return res.status(400).json({ msg: "User already deleted" });
    }

    user.isDeleted = true;
    await user.save();

    return res.json({ msg: "User soft deleted ✅" });
  } catch (err) {
    console.error("Delete User Error:", err);
    return res.status(500).json({ msg: err.message });
  }
};