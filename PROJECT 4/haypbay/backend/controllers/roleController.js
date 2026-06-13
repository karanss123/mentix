import Role from "../models/Role.js";

/* =========================
   CREATE ROLE  (STORE-WISE)
========================= */
export const createRole = async (req, res) => {
  try {
    const name = (req.body.name || "").trim().toLowerCase();
    if (!name) return res.status(400).json({ msg: "Role name is required" });

    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    // ✅ store-wise safe check
    const exists = await Role.findOne({ storeId, name, isActive: true });
    if (exists) return res.status(400).json({ msg: "Role already exists" });

    // ✅ storeId save
    const role = await Role.create({ storeId, name });
    return res.status(201).json(role);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ msg: "Role already exists" });
    }
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   GET ALL ACTIVE ROLES (STORE-WISE)
========================= */
export const getRoles = async (req, res) => {
  try {
    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const roles = await Role.find({ storeId, isActive: true }).sort({ createdAt: -1 });
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   GET ROLE BY ID (STORE-WISE + permissions)
========================= */
export const getRoleById = async (req, res) => {
  try {
    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const role = await Role.findOne({ _id: req.params.id, storeId }).populate("permissions");

    if (!role || !role.isActive) {
      return res.status(404).json({ msg: "Role not found" });
    }
    return res.json(role);
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   UPDATE ROLE NAME (STORE-WISE)
========================= */
export const updateRole = async (req, res) => {
  try {
    const name = (req.body.name || "").trim().toLowerCase();
    if (!name) return res.status(400).json({ msg: "Role name is required" });

    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role || !role.isActive) {
      return res.status(404).json({ msg: "Role not found" });
    }

    role.name = name;
    await role.save();

    return res.json({ msg: "Role updated ✅", role });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ msg: "Role already exists" });
    }
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   SOFT DELETE ROLE (STORE-WISE)
========================= */
export const deleteRole = async (req, res) => {
  try {
    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role || !role.isActive) {
      return res.status(404).json({ msg: "Role not found" });
    }

    role.isActive = false;
    role.deletedAt = new Date();
    await role.save();

    return res.json({ msg: "Role deleted (soft) ✅" });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   GET TRASH ROLES (STORE-WISE)
========================= */
export const getTrashRoles = async (req, res) => {
  try {
    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const roles = await Role.find({ storeId, isActive: false }).sort({ deletedAt: -1 });
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   RESTORE ROLE (STORE-WISE)
========================= */
export const restoreRole = async (req, res) => {
  try {
    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role || role.isActive) {
      return res.status(404).json({ msg: "Role not found in trash" });
    }

    role.isActive = true;
    role.deletedAt = null;
    await role.save();

    return res.json({ msg: "Role restored ✅", role });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ msg: "Active role with same name already exists" });
    }
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   (OPTIONAL but useful)
   PERMANENT DELETE ROLE (STORE-WISE)
   DELETE /api/roles/permanent/:id
========================= */
export const permanentDeleteRole = async (req, res) => {
  try {
    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role) return res.status(404).json({ msg: "Role not found" });

    await Role.deleteOne({ _id: role._id });
    return res.json({ msg: "Role permanently deleted ✅" });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* =========================
   UPDATE ROLE PERMISSIONS (STORE-WISE)
   PUT /api/roles/:id/permissions
========================= */
export const updateRolePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ msg: "permissions must be an array" });
    }

    const storeId = req.storeId;
    if (!storeId) return res.status(400).json({ msg: "Store context missing" });

    const role = await Role.findOne({ _id: req.params.id, storeId });
    if (!role || !role.isActive) {
      return res.status(404).json({ msg: "Role not found" });
    }

    role.permissions = permissions;
    await role.save();

    return res.json({ msg: "Permissions updated ✅", role });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};