import mongoose from "mongoose";
import Store from "../models/Store.js";
import User from "../models/User.js";

const getRoleName = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role;
  if (typeof role === "object") return role.name || "";
  return "";
};

const getPermissionKeys = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return [];
  return permissions
    .map((p) => {
      if (!p) return null;
      if (typeof p === "string") return p;
      if (typeof p === "object") return p.key || p.name || null;
      return null;
    })
    .filter(Boolean);
};

const readStoreIdFromReq = (req) => {
  const h =
    req.headers["x-store-id"] ||
    req.headers["X-Store-Id"] ||
    req.headers["x-storeId"] ||
    req.get?.("x-store-id") ||
    req.get?.("X-Store-Id");

  return (h || "").toString().trim();
};

const requireStore = async (req, res, next) => {
  try {
    const storeId = readStoreIdFromReq(req);

    if (!storeId) {
      return res.status(400).json({
        msg: "x-store-id header is required",
        hint: "Send header: x-store-id: <STORE_ID>",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ msg: "Invalid store id" });
    }

    const store = await Store.findOne({ _id: storeId, isActive: true }).select(
      "_id name isActive"
    );

    if (!store) {
      return res.status(404).json({ msg: "Store not found or inactive" });
    }

    // ✅ protect middleware check
    if (!req.user) {
      return res.status(401).json({
        msg: "Not authorized (protect middleware must run before requireStore)",
      });
    }

    const roleName = (
      req.userRole ||
      getRoleName(req.user?.role) ||
      req.user?.role ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    // ✅ attach store
    req.storeId = storeId;
    req.store = store;

    // ✅ superadmin full access
    if (roleName === "superadmin") {
      return next();
    }

    const userStoreId = req.user?.storeId;

    // ✅ SAME STORE → ALLOW
    if (userStoreId && String(userStoreId) === String(storeId)) {
      return next();
    }

    // ✅ TEMP FIX (IMPORTANT 🔥)
    // user ke paas storeId hi nahi hai → allow
    if (!userStoreId) {
      return next();
    }

    // ✅ ADMIN MULTI-STORE SWITCH
    if (roleName === "admin") {
      const email = (req.user?.email || "").toString().trim().toLowerCase();

      const storeUser = await User.findOne({
        email,
        storeId,
        isDeleted: { $ne: true },
      })
        .select("-password")
        .populate({
          path: "role",
          select: "name storeId permissions",
          populate: {
            path: "permissions",
            select: "key name storeId",
          },
        });

      if (!storeUser) {
        return res.status(403).json({ msg: "Access denied for this store" });
      }

      // optional verify
      if (storeUser.isVerified === false) {
        return res.status(403).json({ msg: "Please verify OTP first" });
      }

      if (
        storeUser.role?.storeId &&
        String(storeUser.role.storeId) !== String(storeId)
      ) {
        return res.status(403).json({ msg: "Role is not valid for this store" });
      }

      req.user = storeUser;
      req.userId = storeUser._id;
      req.userRole = getRoleName(storeUser.role).toLowerCase();
      req.userPermissions = getPermissionKeys(storeUser.role?.permissions).map(
        (x) => String(x).toLowerCase()
      );

      return next();
    }

    // ❌ FINAL DENY
    return res.status(403).json({ msg: "Access denied for this store" });
  } catch (err) {
    console.error("requireStore error:", err);
    return res.status(500).json({ msg: "Server error in store middleware" });
  }
};

export default requireStore;