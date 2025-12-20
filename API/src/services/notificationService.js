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
