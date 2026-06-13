import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Role from "../models/Role.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
    const password = (process.env.SUPERADMIN_PASSWORD || "").trim();
    const name = (process.env.SUPERADMIN_NAME || "Super Admin").trim();

    if (!email || !password) {
      throw new Error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env");
    }

    // global role (storeId null)
    let role = await Role.findOne({ name: "superadmin", storeId: null, isActive: true });
    if (!role) {
      role = await Role.create({ name: "superadmin", storeId: null, permissions: [] });
    }

    // global user (storeId null)
    let user = await User.findOne({ email, storeId: null });
    if (!user) {
      user = await User.create({
        storeId: null,
        name,
        email,
        password, // model pre-save hash
        role: role._id,
        isVerified: true,
        isActive: true,
      });
      console.log("✅ SuperAdmin created:", user.email);
    } else {
      console.log("ℹ️ SuperAdmin already exists:", user.email);
    }

    process.exit(0);
  } catch (e) {
    console.error("❌ seedSuperAdmin error:", e.message);
    process.exit(1);
  }
};

run();