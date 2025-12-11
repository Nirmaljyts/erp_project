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
} from "../controllers/timesheetController.js";

const router = Router();

// GET my weekly timesheet
router.get("/my", authRequired, getMyTimesheetController);

// SAVE one single entry
router.post("/entry", authRequired, saveSingleEntryController);

// SAVE entire week
router.post("/:weekId/save", authRequired, saveTimesheetWeekController);

// SUBMIT week
router.post("/:weekId/submit", authRequired, submitTimesheetController);

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

export default router;
