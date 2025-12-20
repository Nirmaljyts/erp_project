import prisma from "../utils/prisma.js";

export async function getMyNotifications(req, res) {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  res.json(notifications);
}

export async function markNotificationRead(req, res) {
  await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { isRead: true },
  });

  res.json({ success: true });
}

export async function markAllNotificationsRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true });
}
