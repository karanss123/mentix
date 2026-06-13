import User from "../models/User.js";
import Role from "../models/Role.js";

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const roleName = (req.body.role || "").trim().toLowerCase();

    if (!roleName) {
      return res.status(400).json({ msg: "role is required" });
    }

    const roleDoc = await Role.findOne({ name: roleName, isActive: true });
    if (!roleDoc) {
      return res.status(404).json({ msg: "Role not found" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: roleDoc.name, roleId: roleDoc._id }, // ✅ BOTH UPDATED
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json({ msg: "Role updated successfully", user });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
