import prisma from "../utils/prisma.js";
import { resolveReviewer } from "../utils/resolveReviewer.js";

// CREATE LEAVE
export async function createLeaveService(userId, body) {
  const { type, startDate, endDate, reason } = body;

  if (!type || !startDate || !endDate)
    throw new Error("Type, start date and end date are required");

  if (new Date(startDate) > new Date(endDate))
    throw new Error("End date cannot be earlier than start date");

  const approvedById = await resolveReviewer(userId);

  return prisma.leave.create({
    data: {
      userId,
      approvedById,
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
    include: {
      approvedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// GET TEAM LEAVES
// EMPLOYEE       → never receives approvals
// MANAGER        → sees leaves of employees under him (because resolveReviewer assigns him)
// HR             → same: sees leaves routed to HR
// HR_MANAGER     → sees leaves routed to HR_MANAGER
// ADMIN          → sees leaves routed to ADMIN
export function getTeamLeavesService(user) {
  return prisma.leave.findMany({
    where: {
      approvedById: user.id,
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

  if (leave.approvedById !== approver.id)
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

  if (leave.approvedById !== approver.id)
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

  // 1️⃣ EMPLOYEE → only own
  if (user.role === "EMPLOYEE") {
    where.userId = user.id;
  }

  // 2️⃣ MANAGER → own + employees in projects
  else if (user.role === "MANAGER") {
    where.OR = [
      { userId: user.id },
      {
        user: {
          projects: {
            some: { project: { managerId: user.id } },
          },
        },
      },
    ];
  }

  // 3️⃣ HR → only own
  else if (user.role === "HR") {
    where.userId = user.id;
  }

  // 4️⃣ HR_MANAGER → own + HR + MANAGER + bench employees
  else if (user.role === "HR_MANAGER") {
    where.OR = [
      // HR_MANAGER → own leave
      { userId: user.id },

      // HR + MANAGER (explicitly exclude ADMIN)
      {
        user: {
          role: { in: ["HR", "MANAGER"] },
          NOT: { role: "ADMIN" },
        },
      },

      // BENCH employees (exclude ADMIN)
      {
        user: {
          role: { not: "ADMIN" },
          projects: {
            none: {
              project: {
                status: { in: ["ACTIVE", "ON_HOLD"] },
              },
            },
          },
        },
      },
    ];
  }

  // 5️⃣ ADMIN → sees ALL leaves (no filtering)
  else if (user.role === "ADMIN") {
    where = { deletedAt: null };
  }

  // Fetch data
  const [stats, leaves] = await Promise.all([
    prisma.leave.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),

    prisma.leave.findMany({
      where,
      include: {
        user: true,
        approvedBy: true,
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const total = leaves.length;

  return { stats, leaves, total };
}

export async function deleteApprovedLeaveService(id) {
  const leave = await prisma.leave.findUnique({
    where: { id },
  });

  if (!leave) {
    const error = new Error("Leave not found");
    error.statusCode = 404;
    throw error;
  }

  if (leave.status !== "APPROVED") {
    const error = new Error("Only approved leaves can be deleted");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const start = new Date(leave.startDate);

  if (start <= now) {
    const error = new Error(
      "Cannot delete approved leaves that have already started"
    );
    error.statusCode = 400;
    throw error;
  }

  // Soft delete
  await prisma.leave.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return "Approved leave deleted successfully";
}
