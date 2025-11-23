import { Router } from "express";
import {
  listHolidaysController,
  createHolidayController,
  deleteHolidayController,
  updateHolidayController,
  uploadHolidayBulkController,
} from "../controllers/holidayController.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/", authRequired, listHolidaysController);

router.post(
  "/",
  authRequired,
  requireRole("ADMIN", "HR"),
  createHolidayController
);

router.put(
  "/:id",
  authRequired,
  requireRole("ADMIN", "HR"),
  updateHolidayController
);

router.delete(
  "/:id",
  authRequired,
  requireRole("ADMIN", "HR"),
  deleteHolidayController
);

router.post(
  "/bulk",
  authRequired,
  requireRole("ADMIN", "HR"),
  upload.single("file"),
  uploadHolidayBulkController
);

export default router;
