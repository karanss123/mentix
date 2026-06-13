import User from "../models/User.js";
import Role from "../models/Role.js";
import Store from "../models/Store.js";
import jwt from "jsonwebtoken";
import { sendOTP } from "../config/mail.js";

/* =========================================================
   HELPER: Resolve Store ID
========================================================= */
const getStoreIdFromReq = async (req) => {
  const h =
    req.headers["x-store-id"] ||
    req.headers["X-Store-Id"] ||
    req.headers["x-storeId"];

  if (h) return String(h).trim();

  if (req.body?.storeId) return String(req.body.storeId).trim();

  const storeName = (req.body?.storeName || "").trim();
  if (!storeName) return null;

  const store = await Store.findOne({
    name: new RegExp(`^${storeName}$`, "i"),
    isActive: true,
  }).select("_id");

  return store?._id ? String(store._id) : null;
};

/* =========================================================
   HELPER: Build Final Auth Payload
   - overrideStoreId only for normal user selected store context
========================================================= */
const buildAuthPayload = (user, overrideStoreId = null) => {
  const roleName = (user.role?.name || "user").toLowerCase();
  const roleId = user.role?._id;

  const permissions = (user.role?.permissions || [])
    .map((p) => (typeof p === "string" ? p : p?.key))
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());

  const finalStoreId = overrideStoreId || user.storeId || null;

  const token = jwt.sign(
    {
      id: user._id,
      role: roleName,
      roleId,
      storeId: finalStoreId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );

  return {
    msg: "Login successful",
    token,
    user: {
      id: user._id,
      storeId: finalStoreId,
      name: user.name,
      email: user.email,
      role: roleName,
      roleId,
      permissions,
      canManage: roleName === "admin" || roleName === "superadmin",
    },
  };
};

/* =========================================================
   REGISTER
   - ONLY USER changed:
   - normal user => no fixed storeId
   - admin/staff flow untouched elsewhere
========================================================= */
export const registerUser = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // ✅ normal user is now GLOBAL (no fixed store)
    const existingUser = await User.findOne({
      storeId: null,
      email,
    });

    if (existingUser?.isVerified) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    // ✅ find global/default user role
    let roleDoc = await Role.findOne({
      storeId: null,
      name: "user",
      isActive: true,
    });

    // fallback if your role docs are not global
    if (!roleDoc) {
      roleDoc = await Role.findOne({
        name: "user",
        isActive: true,
      }).sort({ createdAt: 1 });
    }

    if (!roleDoc) {
      return res.status(400).json({ msg: "Default user role not found" });
    }

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      existingUser.role = roleDoc._id;
      existingUser.storeId = null;
      await existingUser.save();
    } else {
      await User.create({
        storeId: null, // ✅ important
        name,
        email,
        password,
        otp,
        otpExpires,
        role: roleDoc._id,
        isVerified: false,
      });
    }

    await sendOTP(email, otp);

    return res.status(201).json({ msg: "OTP sent to email" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

/* =========================================================
   VERIFY OTP
   - normal user is global => storeId null
========================================================= */
export const verifyOtp = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const otp = (req.body.otp || "").trim();

    const user = await User.findOne({
      storeId: null,
      email,
    });

    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return res.json({ msg: "User verified successfully" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

/* =========================================================
   LOGIN
   - superadmin => direct login
   - normal user (global) => always store picker
   - admin/shopkeeper/store-staff => existing store-based flow same
========================================================= */
export const loginUser = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    /* ---------- 1️⃣ Check GLOBAL user ---------- */
    const globalUser = await User.findOne({
      storeId: null,
      email,
      isVerified: true,
    }).populate("role");

    if (globalUser) {
      const ok = await globalUser.comparePassword(password);
      if (!ok) return res.status(400).json({ msg: "Wrong password" });

      const roleName = (globalUser.role?.name || "").toLowerCase();

      // ✅ superadmin same as before
      if (roleName === "superadmin") {
        return res.json(buildAuthPayload(globalUser));
      }

      // ✅ normal user => always store picker
      if (roleName === "user") {
        const stores = await Store.find({ isActive: true })
          .select("_id name")
          .sort({ name: 1 });

        const tempToken = jwt.sign(
          {
            email,
            userId: globalUser._id,
            role: "user",
            purpose: "store_select",
          },
          process.env.JWT_SECRET,
          { expiresIn: "10m" }
        );

        return res.json({
          needsStore: true,
          tempToken,
          stores: stores.map((s) => ({
            storeId: String(s._id),
            storeName: s.name,
          })),
        });
      }

      // other global roles if any
      return res.json(buildAuthPayload(globalUser));
    }

    /* ---------- 2️⃣ Existing store-based users flow ---------- */
    const storeUsers = await User.find({
      storeId: { $ne: null },
      email,
      isVerified: true,
    })
      .populate("storeId", "name isActive")
      .populate("role");

    if (!storeUsers.length) {
      return res.status(404).json({ msg: "User not found" });
    }

    const matched = [];

    for (const u of storeUsers) {
      const ok = await u.comparePassword(password);
      if (ok && u.storeId?.isActive !== false) {
        matched.push(u);
      }
    }

    if (!matched.length) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const stores = matched.map((u) => ({
      storeId: String(u.storeId._id),
      storeName: u.storeId.name,
    }));

    const tempToken = jwt.sign(
      {
        email,
        purpose: "store_select",
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({
      needsStore: true,
      tempToken,
      stores,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

/* =========================================================
   SELECT STORE AFTER LOGIN
   - normal user: choose any active store, mark explored
   - existing admin/store staff: existing flow same
========================================================= */
export const selectStoreAfterLogin = async (req, res) => {
  try {
    const storeId = String(req.body?.storeId || "").trim();
    if (!storeId) {
      return res.status(400).json({ msg: "storeId required" });
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ")
      ? auth.slice(7)
      : req.body?.tempToken;

    if (!token) {
      return res.status(401).json({ msg: "tempToken required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "store_select") {
      return res.status(401).json({ msg: "Invalid tempToken" });
    }

    const store = await Store.findOne({
      _id: storeId,
      isActive: true,
    }).select("_id name");

    if (!store) {
      return res.status(404).json({ msg: "Store not found" });
    }

    /* ---------- 1️⃣ Normal global user ---------- */
    if (decoded.role === "user" && decoded.userId) {
      const user = await User.findOne({
        _id: decoded.userId,
        email: decoded.email,
        storeId: null,
        isVerified: true,
      }).populate("role");

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      // ✅ track explored store if method exists
      if (typeof user.markStoreExplored === "function") {
        user.markStoreExplored(store._id);
        await user.save();
      }

      return res.json(buildAuthPayload(user, String(store._id)));
    }

    /* ---------- 2️⃣ Existing store-based users flow ---------- */
    const user = await User.findOne({
      storeId,
      email: decoded.email,
      isVerified: true,
    }).populate("role");

    if (!user) {
      return res.status(404).json({ msg: "User not found in store" });
    }

    return res.json(buildAuthPayload(user));
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};