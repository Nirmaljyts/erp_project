import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/", authRequired, getMyNotifications);
router.patch("/:id/read", authRequired, markNotificationRead);
router.patch("/read-all", authRequired, markAllNotificationsRead);

export default router;
