import prisma from "../utils/prisma.js";
import { resolveReviewer } from "../utils/resolveReviewer.js";

// CREATE LEAVE
export async function createLeaveService(userId, body) {
  const { type, startDate, endDate, reason } = body;

  if (!type || !startDate || !endDate)
    throw new Error("Type, start date and end date are required");

  if (new Date(startDate) > new Date(endDate))
    throw new Error("End date cannot be earlier than start date");

  const reviewerId = await resolveReviewer(userId);

  return prisma.leave.create({
    data: {
      userId,
      reviewerId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    },
  });
}

// GET MY LEAVES
export function getMyLeavesService(userId) {
  return prisma.leave.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

// GET TEAM LEAVES
// MANAGER → only employees under his projects
// HR / ADMIN → all employees
export async function getTeamLeavesService(user) {
  return prisma.leave.findMany({
    where: {
      reviewerId: user.id,     // ONLY THIS
      status: "PENDING",
      deletedAt: null,
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

// APPROVE LEAVE
export async function approveLeaveService(approver, leaveId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave) throw new Error("Leave request not found");
  if (leave.status !== "PENDING") throw new Error("Not pending");

  if (leave.reviewerId !== approver.id)
    throw new Error("You are not authorized to approve this leave");

  return prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "APPROVED",
      approvedById: approver.id,
      decidedAt: new Date(),
    },
  });
}

// REJECT LEAVE
export async function rejectLeaveService(approver, leaveId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave) throw new Error("Leave request not found");
  if (leave.status !== "PENDING") throw new Error("Not pending");

  if (leave.reviewerId !== approver.id)
    throw new Error("You are not authorized to reject this leave");

  return prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "REJECTED",
      approvedById: approver.id,
      decidedAt: new Date(),
    },
  });
}

// CANCEL LEAVE (Employee)
export async function cancelLeaveService(user, leaveId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave) throw new Error("Leave request not found");

  if (leave.userId !== user.id) throw new Error("You cannot cancel this leave");

  if (!["PENDING", "APPROVED"].includes(leave.status))
    throw new Error("Cannot cancel this leave");

  return prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "CANCELLED",
      decidedAt: new Date(),
    },
  });
}

// LEAVE DASHBOARD
export async function getLeaveDashboardService(user) {
  let where = { deletedAt: null };

  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  }

  else if (user.role === "MANAGER") {
    where.OR = [
      // Manager's own leaves
      { userId: user.id },

      // Employees assigned directly under manager
      { user: { managerId: user.id } },

      // Employees working in manager's projects
      {
        user: {
          projects: {
            some: {
              project: {
                managerId: user.id
              }
            }
          }
        }
      }
    ];
  }

  else if (user.role === "ADMIN" || user.role === "HR") {
    // full access
  }

  const [stats, leaves] = await Promise.all([
    prisma.leave.groupBy({
      by: ["status"],
      where,
      _count: true
    }),
    prisma.leave.findMany({
      where,
      include: { user: true },
      orderBy: { startDate: "asc" }
    })
  ]);

  const total = leaves.length;

  return { stats, leaves, total };
}
