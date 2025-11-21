import { Router } from "express";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignUsersToProject,
  removeEmployeeFromProject,
  updateProjectStatus,
} from "../controllers/projectController.js";

import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  authRequired,
  requireRole("ADMIN", "MANAGER", "EMPLOYEE"),
  listProjects
);

router.get(
  "/:id",
  authRequired,
  requireRole("ADMIN", "MANAGER", "EMPLOYEE"),
  getProject
);

router.post("/", authRequired, requireRole("ADMIN", "MANAGER"), createProject);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN", "MANAGER"),
  updateProject
);

router.put(
  "/:id/assign",
  authRequired,
  requireRole("ADMIN", "MANAGER"),
  assignUsersToProject
);

router.delete(
  "/:id/remove-employee/:employeeId",
  authRequired,
  requireRole("ADMIN", "MANAGER"),
  removeEmployeeFromProject
);

router.put(
  "/:id/status",
  authRequired,
  requireRole("ADMIN", "MANAGER"),
  updateProjectStatus
);

router.delete("/:id", authRequired, requireRole("ADMIN"), deleteProject);

export default router;
