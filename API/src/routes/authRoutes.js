import { Router } from "express";
import {
  register,
  login,
  me,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  refreshTokenController,
} from "../controllers/authController.js";

import { authRequired } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshTokenController);
router.get("/me", authRequired, me);

router.post("/password-reset/request-otp", requestPasswordResetOtp);
router.post("/password-reset/verify-otp", verifyPasswordResetOtp);
router.post("/password-reset/reset", resetPassword);

export default router;
