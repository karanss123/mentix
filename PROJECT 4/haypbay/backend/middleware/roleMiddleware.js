import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =========================
   1) LOGIN REQUIRED (PROTECT)
========================= */
export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const token = auth.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ supports id / _id
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Not authorized, invalid token payload" });
    }

    // ✅ IMPORTANT: populate role -> get role.name
    const user = await User.findById(userId)
      .populate("role", "name")
      .select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    // ✅ normalize role as STRING for easy checks
    const roleName = (user.role?.name || decoded.role || "user")
      .toString()
      .trim()
      .toLowerCase();

    // ✅ attach normalized user info
    req.user = {
      ...user.toObject(),
      role: roleName,            // now "admin"/"shopkeeper"/"user"
      roleId: user.role?._id,    // optional: Role ObjectId
    };
    req.userId = user._id;

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Not authorized, token invalid/expired" });
  }
};

/* =========================
   2) ADMIN ONLY
========================= */
export const adminOnly = (req, res, next) => {
  const role = (req.user?.role || "").toString().trim().toLowerCase();
  if (role === "admin") return next();
  return res.status(403).json({ message: "Forbidden: Admin access only" });
};

/* =========================
   3) FLEXIBLE ROLE CHECKER
   Usage: permitRoles("admin", "shopkeeper")
========================= */
export const permitRoles = (...roles) => {
  const allowed = roles
    .flat()
    .filter(Boolean)
    .map((r) => r.toString().trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (allowed.length === 0) {
      return res.status(403).json({ message: "Forbidden: No roles allowed" });
    }

    const userRole = (req.user.role || "").toString().trim().toLowerCase();

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Allowed roles: ${allowed.join(", ")}`,
      });
    }

    next();
  };
};

/* =========================
   4) SHOPKEEPER OR ADMIN
========================= */
export const shopkeeperOrAdmin = permitRoles("shopkeeper", "admin");
