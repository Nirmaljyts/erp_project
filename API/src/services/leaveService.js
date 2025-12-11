import prisma from "../utils/prisma.js";
import { resolveReviewer } from "../utils/resolveReviewer.js";

// CREATE LEAVE
export async function createLeaveService(userId, body) {
  const { type, startDate, endDate, reason } = body;

  if (!type || !startDate || !endDate)
    throw new Error("Type, start date and end date are required");

  if (new Date(startDate) > new Date(endDate))
    throw new Error("End date cannot be earlier than start date");

  // 🔥 Resolve reviewer based on role + project logic
  const reviewerId = await resolveReviewer(userId);

  if (!reviewerId)
    throw new Error("No valid reviewer found for this leave request");

  return prisma.leave.create({
    data: {
      userId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || null,
      status: "PENDING",

      // Assign reviewer here
      approvedById: reviewerId,

      // Leave rejectedById empty
      rejectedById: null,
    },
  });
}

// GET MY LEAVES
export function getMyLeavesService(userId) {
  return prisma.leave.findMany({
    where: { userId, deletedAt: null },
    include: {
      approvedBy: true,
      rejectedBy: true,
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
export async function approveLeaveService(leaveId, reviewerId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });

  if (!leave) throw new Error("Leave not found");
  if (leave.status !== "PENDING") throw new Error("Already processed");
  if (leave.approvedById !== reviewerId)
    throw new Error("You are not authorized to approve this leave");

  return prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "APPROVED",
      approvedById: reviewerId,
      rejectedById: null,
      decidedAt: new Date(),
    },
    include: { approvedBy: true },
  });
}

// REJECT LEAVE
export async function rejectLeaveService(leaveId, reviewerId) {
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });

  if (!leave) throw new Error("Leave not found");
  if (leave.status !== "PENDING") throw new Error("Already processed");
  if (leave.approvedById !== reviewerId)
    throw new Error("You are not authorized to reject this leave");

  return prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "REJECTED",
      rejectedById: reviewerId,
      approvedById: null,
      decidedAt: new Date(),
    },
    include: { rejectedBy: true },
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
    where.OR = [
      { userId: user.id }, // HR's own leaves
      { approvedById: user.id }, // HR approved
      { rejectedById: user.id }, // HR rejected
    ];
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
