import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.js";
import {
  getMyTimesheetController,
  saveSingleEntryController,
  saveTimesheetWeekController,
  submitTimesheetController,
  createDefinitionController,
  listDefinitionsController,
  updateDefinitionController,
  deleteDefinitionController,
  getTimesheetApprovalsController,
  approveTimesheetController,
  rejectTimesheetController,
  getTimesheetReportController,
} from "../controllers/timesheetController.js";

const router = Router();

// ----------------------------------------- TIMESHEET -----------------------------------------

// GET my weekly timesheet
router.get("/my", authRequired, getMyTimesheetController);

// SAVE one single entry
router.post("/entry", authRequired, saveSingleEntryController);

// SAVE entire week
router.post("/:weekId/save", authRequired, saveTimesheetWeekController);

// SUBMIT week
router.post("/:weekId/submit", authRequired, submitTimesheetController);

// ----------------------------------------- TIMESHEET APPROVAL -----------------------------------------

router.get(
  "/approvals",
  authRequired,
  requireRole("ADMIN", "HR", "HR_MANAGER", "MANAGER"),
  getTimesheetApprovalsController
);
router.post(
  "/:weekId/approve",
  authRequired,
  requireRole("ADMIN", "HR", "HR_MANAGER", "MANAGER"),
  approveTimesheetController
);
router.post(
  "/:weekId/reject",
  authRequired,
  requireRole("ADMIN", "HR", "HR_MANAGER", "MANAGER"),
  rejectTimesheetController
);

// ----------------------------------------- TIMESHEET DEFINITION -----------------------------------------

// DEFINITIONS (ADMIN + HR_MANAGER)
router.post(
  "/definitions",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER"),
  createDefinitionController
);

router.get(
  "/definitions",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER"),
  listDefinitionsController
);

router.put(
  "/definitions/:id",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER"),
  updateDefinitionController
);

router.delete(
  "/definitions/:id",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER"),
  deleteDefinitionController
);

// ----------------------------------------- TIMESHEET REPORT -----------------------------------------

router.get(
  "/reports",
  authRequired,
  requireRole("ADMIN", "HR", "HR_MANAGER", "MANAGER"),
  getTimesheetReportController
);

export default router;
