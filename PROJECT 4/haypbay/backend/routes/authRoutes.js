import express from "express";
import {
  registerUser,
  verifyOtp,
  loginUser,
  selectStoreAfterLogin, // ✅ NEW
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js"; // ✅ NEW

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);

/*
   ✅ NEW ROUTE
   Used after login when multiple stores found
   Requires tempToken in Authorization header
*/
router.post("/select-store", protect, selectStoreAfterLogin);

export default router;