import prisma from "../utils/prisma.js";
import { sendEmail } from "./emailService.js";

export async function notify({
  userId,
  type,
  title,
  message,
  entityId = null,
  email = false,
}) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      entityId,
    },
  });

  if (email) {
    await sendEmail(userId, title, message);
  }
}

export function getMyNotificationsService(userId) {
  return prisma.notification.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function markNotificationReadService(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export function markAllNotificationsReadService(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export function clearNotificationService(id, userId) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: {
      isRead: true,
      deletedAt: new Date(),
    },
  });
}

export function clearAllNotificationsService(userId) {
  return prisma.notification.updateMany({
    where: {
      userId,
      deletedAt: null,
    },
    data: {
      isRead: true,
      deletedAt: new Date(),
    },
  });
}
