import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  createLeave,
  getMyLeaves,
  getTeamLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveDashboard,
} from "../controllers/leaveController.js";

const router = Router();

// Apply leave
router.post("/", authRequired, createLeave);

// My leaves
router.get("/my", authRequired, getMyLeaves);

// Pending leaves to review
router.get(
  "/team",
  authRequired,
  requireRole("MANAGER", "HR", "ADMIN"),
  getTeamLeaves
);

// Approve / Reject
router.post("/:id/approve", authRequired, requireRole("ADMIN", "HR", "MANAGER"), approveLeave);
router.post("/:id/reject", authRequired, requireRole("ADMIN", "HR", "MANAGER"), rejectLeave);

// Cancel
router.post("/:id/cancel", authRequired, cancelLeave);

// Dashboard
router.get(
  "/dashboard",
  authRequired,
  requireRole("ADMIN", "HR", "MANAGER", "EMPLOYEE"),
  getLeaveDashboard
);

export default router;
