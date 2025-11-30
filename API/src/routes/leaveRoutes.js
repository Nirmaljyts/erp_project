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
  deleteApprovedLeaveController,
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
  requireRole("MANAGER", "HR_MANAGER", "HR", "ADMIN"),
  getTeamLeaves
);

// Approve / Reject
router.post(
  "/:id/approve",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER"),
  approveLeave
);
router.post(
  "/:id/reject",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER"),
  rejectLeave
);

// Cancel
router.post("/:id/cancel", authRequired, cancelLeave);

// Dashboard
router.get(
  "/dashboard",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"),
  getLeaveDashboard
);

// Delete approved leave if needed
router.delete(
  "/approved/:id",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR"),
  deleteApprovedLeaveController
);

export default router;
