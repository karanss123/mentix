import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =========================
   HELPERS
========================= */
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

const extractToken = (req) => {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  if (!auth) return null;

  const parts = auth.split(" ").filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === "bearer") {
    return parts.slice(1).join(" ").trim();
  }
  return null;
};

/* =========================
   1️⃣ PROTECT ROUTES
   ✅ Updated: supports tempToken (store_select)
========================= */
export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token provided",
      });
    }

    if (token.split(".").length !== 3) {
      return res.status(401).json({
        message: "Invalid token format. Please login again.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({
        message: "Server misconfigured (JWT_SECRET missing)",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ NEW: allow tempToken for store selection flow
    // tempToken payload: { email, purpose:"store_select" }
    if (decoded?.purpose === "store_select") {
      req.tempAuth = decoded; // { email, purpose }
      return next();
    }

    // ✅ Normal auth token must have decoded.id
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate({
        path: "role",
        select: "name storeId permissions",
        populate: {
          path: "permissions",
          select: "key name storeId",
        },
      });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.userRole = getRoleName(user.role).toLowerCase();
    req.userPermissions = getPermissionKeys(user.role?.permissions).map((x) =>
      String(x).toLowerCase()
    );

    next();
  } catch (error) {
    console.error("Protect Middleware Error:", error.name, error.message);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   2️⃣ ROLE CHECKER
========================= */
export const permitRoles = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });

  const roleName = (req.userRole || "").toLowerCase();
  const allowed = roles.map((r) => String(r).toLowerCase());

  // ✅ SUPERADMIN bypass store restriction
  if (roleName !== "superadmin") {
    if (
      req.storeId &&
      req.user.storeId &&
      String(req.user.storeId) !== String(req.storeId)
    ) {
      return res
        .status(403)
        .json({ message: "Access denied for this store" });
    }
  }

  if (!allowed.includes(roleName)) {
    return res.status(403).json({
      message: `Access denied. Allowed roles: ${allowed.join(", ")}`,
    });
  }

  next();
};

/* =========================
   3️⃣ PERMISSION CHECKER
========================= */
export const permitPermissions = (required = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });

  const roleName = (req.userRole || "").toLowerCase();

  // ✅ SUPERADMIN full bypass
  if (roleName === "superadmin") return next();

  // ✅ ADMIN bypass permissions check (unlock admin panel)
  // (store validation still applies below)
  const isAdmin = roleName === "admin";

  if (!req.storeId) {
    return res.status(400).json({
      message: "x-store-id header is required",
    });
  }

  if (!req.user.storeId) {
    return res.status(403).json({
      message: "User is not linked to any store",
    });
  }

  if (String(req.user.storeId) !== String(req.storeId)) {
    return res.status(403).json({
      message: "Access denied for this store",
    });
  }

  if (
    req.user.role?.storeId &&
    String(req.user.role.storeId) !== String(req.storeId)
  ) {
    return res.status(403).json({
      message: "Role is not valid for this store",
    });
  }

  // ✅ Admin doesn't need explicit permission keys
  if (isAdmin) return next();

  const have = req.userPermissions || [];
  const need = required.map((x) => String(x).toLowerCase());

  const ok = need.every((perm) => have.includes(perm));

  if (!ok) {
    return res.status(403).json({
      message: "Access denied. Missing required permission(s).",
      required: need,
    });
  }

  next();
};

/* =========================
   SHORTCUTS
========================= */
export const adminOnly = permitRoles(["admin", "superadmin"]);
export const superAdminOnly = permitRoles(["superadmin"]);
export const shopkeeperOrAdmin = permitRoles([
  "shopkeeper",
  "admin",
  "superadmin",
]);