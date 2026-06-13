import User from "../models/User.js";
import Role from "../models/Role.js";

/**
 * POST /api/superadmin/create-store-admin
 * Body: { storeId, name, email, password }
 * SuperAdmin only
 */
export const createStoreAdmin = async (req, res) => {
  try {
    const storeId = (req.body.storeId || "").trim();
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!storeId || !name || !email || !password) {
      return res.status(400).json({
        message: "storeId, name, email, password are required",
      });
    }

    // ✅ check existing user in same store
    const exists = await User.findOne({ storeId, email, isActive: true });
    if (exists) {
      return res.status(409).json({
        message: "Admin with this email already exists in this store",
      });
    }

    // ✅ get store-wise admin role (seedStoreAccess creates it)
    const adminRole = await Role.findOne({
      storeId,
      name: "admin",
      isActive: true,
    });

    if (!adminRole) {
      return res.status(400).json({
        message:
          'Admin role not found for this store. Make sure store seeding ran (admin/shopkeeper/user).',
      });
    }

    // ✅ IMPORTANT: do NOT bcrypt here (User model pre-save will hash)
    const user = await User.create({
      storeId,
      name,
      email,
      password,
      role: adminRole._id,
      isVerified: true, // ✅ direct verified (no OTP for admin created by superadmin)
      isActive: true,
    });

    return res.status(201).json({
      message: "Store admin created successfully",
      admin: {
        id: user._id,
        storeId: user.storeId,
        name: user.name,
        email: user.email,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("createStoreAdmin error:", err);

    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate email for this store" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};