import prisma from "../utils/prisma.js";
import { notify } from "../services/notificationService.js";
import { subHours } from "date-fns";

const cutoff = subHours(new Date(), 24);

export async function runLeaveReminders() {
  const leaves = await prisma.leave.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: cutoff },
    },
  });

  for (const leave of leaves) {
    await notify({
      userId: leave.approverId,
      type: "REMINDER",
      title: "Pending leave approval",
      message: "A leave request is pending approval",
      entityId: leave.id,
      email: true,
    });
  }
}
