import {
  getMyNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
  clearNotificationService,
  clearAllNotificationsService,
} from "../services/notificationService.js";

export async function getMyNotifications(req, res) {
  const userId = req.user.id;
  const notifications = await getMyNotificationsService(userId);
  res.json(notifications);
}

export async function markNotificationRead(req, res) {
  const id = Number(req.params.id);
  const userId = req.user.id;

  await markNotificationReadService(id, userId);
  res.json({ success: true });
}

export async function markAllNotificationsRead(req, res) {
  const userId = req.user.id;

  await markAllNotificationsReadService(userId);
  res.json({ success: true });
}

export async function clearNotification(req, res) {
  const id = Number(req.params.id);
  const userId = req.user.id;

  await clearNotificationService(id, userId);
  res.json({ success: true });
}

export async function clearAllNotifications(req, res) {
  const userId = req.user.id;

  await clearAllNotificationsService(userId);
  res.json({ success: true });
}
