import { Router } from "express";
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  listManagers,
  listAvailableEmployees,
} from "../controllers/userController.js";

import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

// LIST (paginated)
router.get(
  "/",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"),
  listUsers
);

router.get(
  "/:id",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"),
  getUserById
);

// CREATE USER
router.post(
  "/",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR"),
  createUser
);

// UPDATE USER
router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR"),
  updateUser
);

// DELETE USER
router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR"),
  deleteUser
);

// GET ALL MANAGERS
router.get(
  "/managers",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER"),
  listManagers
);

// GET EMPLOYEES NOT ASSIGNED TO ACTIVE PROJECTS
router.get(
  "/employees",
  authRequired,
  requireRole("ADMIN", "HR_MANAGER", "HR", "MANAGER"),
  listAvailableEmployees
);

export default router;
