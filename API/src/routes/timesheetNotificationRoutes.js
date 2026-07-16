import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  timesheetSubmitted,
  timesheetApproved,
  timesheetRejected,
} from "../controllers/timesheetNotificationController.js";

const router = Router();

router.post("/submitted", authRequired, timesheetSubmitted);
router.post("/approved", authRequired, timesheetApproved);
router.post("/rejected", authRequired, timesheetRejected);

export default router;
