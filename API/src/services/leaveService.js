import prisma from "../utils/prisma.js";
import { resolveReviewer } from "../utils/resolveReviewer.js";
import { notify } from "./notificationService.js";

// CREATE LEAVE
export async function createLeaveService(userId, body) {
  const { type, startDate, endDate, reason, dayType } = body;

  if (!type || !startDate || !endDate) {
    throw new Error("Type, start date and end date are required");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new Error("End date cannot be earlier than start date");
  }

  let finalDayType = "FULL";

  if (["CASUAL", "SICK"].includes(type)) {
    if (!dayType) {
      throw new Error("Day type is required for Casual and Sick leave");
    }

    if (dayType === "HALF" && start.toDateString() !== end.toDateString()) {
      throw new Error("Half day leave must be for a single day");
    }

    finalDayType = dayType;
  }

  const reviewerId = await resolveReviewer(userId);
  if (!reviewerId) {
    throw new Error("No valid reviewer found for this leave request");
  }

  const leave = await prisma.leave.create({
    data: {
      userId,
      type,
      dayType: finalDayType,
      startDate: start,
      endDate: end,
      reason: reason || null,
      status: "PENDING",
      approvedById: reviewerId,
      rejectedById: null,
    },
    include: {
      user: true,
    },
  });

  const isSelfApproved = reviewerId === userId;

  const formattedDate =
    start.toDateString() === end.toDateString()
      ? start.toDateString()
      : `${start.toDateString()} – ${end.toDateString()}`;

  // Case 1: requester and approver are DIFFERENT
  if (!isSelfApproved) {
    await notify({
      userId: reviewerId,
      type: "LEAVE_REQUESTED",
      title: "Leave approval required",
      message: `${
        leave.user.name
      } requested ${leave.type.toLowerCase()} leave for ${formattedDate}`,
      entityId: leave.id,
      email: true,
    });
  }

  // Notify APPLICANT (always)
  await notify({
    userId: leave.userId,
    type: "LEAVE_REQUESTED",
    title: "Leave applied",
    message: `${leave.type.toLowerCase()} leave applied for ${formattedDate}`,
    entityId: leave.id,
    email: false,
  });

  return leave;
}

// GET MY LEAVES
// services/leaveService.js
export async function getMyLeavesService(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where: { userId, deletedAt: null },
      include: {
        approvedBy: true,
        rejectedBy: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),

    prisma.leave.count({
      where: { userId, deletedAt: null },
    }),
  ]);

  return {
    data: leaves,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  };
}

// GET TEAM LEAVES
// EMPLOYEE       → never receives approvals
// MANAGER        → sees leaves of employees under him (because resolveReviewer assigns him)
// HR             → same: sees leaves routed to HR
// HR_MANAGER     → sees leaves routed to HR_MANAGER
// ADMIN          → sees leaves routed to ADMIN
export async function getTeamLeavesService(user, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [leaves, total] = await Promise.all([
    prisma.leave.findMany({
      where: {
        approvedById: user.id,
        status: "PENDING",
        deletedAt: null,
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),

    prisma.leave.count({
      where: {
        approvedById: user.id,
        status: "PENDING",
        deletedAt: null,
      },
    }),
  ]);

  return {
    data: leaves,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  };
}

// APPROVE LEAVE
export async function approveLeaveService(leaveId, reviewerId) {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
    include: { user: true },
  });

  if (!leave) throw new Error("Leave not found");
  if (leave.status !== "PENDING") throw new Error("Already processed");
  if (leave.approvedById !== reviewerId)
    throw new Error("You are not authorized to approve this leave");

  const updatedLeave = await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "APPROVED",
      approvedById: reviewerId,
      rejectedById: null,
      decidedAt: new Date(),
    },
    include: { user: true },
  });

  //  Notify
  await notify({
    userId: updatedLeave.userId,
    type: "LEAVE_APPROVED",
    title: "Leave approved",
    message: `Your ${updatedLeave.type.toLowerCase()} leave has been approved`,
    entityId: updatedLeave.id,
    email: true,
  });

  return updatedLeave;
}

// REJECT LEAVE
export async function rejectLeaveService(leaveId, reviewerId) {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
    include: { user: true },
  });

  if (!leave) throw new Error("Leave not found");
  if (leave.status !== "PENDING") throw new Error("Already processed");
  if (leave.approvedById !== reviewerId)
    throw new Error("You are not authorized to reject this leave");

  const updatedLeave = await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "REJECTED",
      rejectedById: reviewerId,
      approvedById: null,
      decidedAt: new Date(),
    },
    include: { user: true },
  });

  // Notify
  await notify({
    userId: updatedLeave.userId,
    type: "LEAVE_REJECTED",
    title: "Leave rejected",
    message: `Your ${updatedLeave.type.toLowerCase()} leave was rejected`,
    entityId: updatedLeave.id,
    email: true,
  });
  // }

  return updatedLeave;
}

// CANCEL LEAVE (Employee)
export async function cancelLeaveService(user, leaveId) {
  const leave = await prisma.leave.findUnique({
    where: { id: leaveId },
  });

  if (!leave) throw new Error("Leave request not found");
  if (leave.userId !== user.id) throw new Error("You cannot cancel this leave");
  if (!["PENDING", "APPROVED"].includes(leave.status))
    throw new Error("Cannot cancel this leave");

  const updatedLeave = await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status: "CANCELLED",
      decidedAt: new Date(),
    },
  });

  // Notify
  await notify({
    userId: leave.approvedById,
    type: "LEAVE_CANCELLED",
    title: "Leave cancelled",
    message: "An approved leave was cancelled by the employee",
    entityId: leave.id,
    email: true,
  });

  return updatedLeave;
}

// LEAVE DASHBOARD
const LEAVE_LIMITS = {
  ANNUAL: 10,
  CASUAL: 10,
  SICK: 10,
  WFH: 10,
  UNPAID: null, // LOP
};

function calculateLeaveDays(leave) {
  if (leave.dayType === "HALF") return 0.5;

  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);

  return (
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

// LEAVE DASHBOARD
export async function getLeaveDashboardService(user, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

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

  // 3️⃣ HR → own + processed
  else if (user.role === "HR") {
    where.OR = [
      { userId: user.id },
      { approvedById: user.id },
      { rejectedById: user.id },
    ];
  }

  // 4️⃣ HR_MANAGER → own + HR + MANAGER + bench
  else if (user.role === "HR_MANAGER") {
    where.OR = [
      { userId: user.id },
      {
        user: {
          role: { in: ["HR", "MANAGER"] },
          NOT: { role: "ADMIN" },
        },
      },
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

  // 5️⃣ ADMIN → all
  else if (user.role === "ADMIN") {
    where = { deletedAt: null };
  }

  /* ---------------- FETCH DATA ---------------- */

  const [stats, leaves, total] = await Promise.all([
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
      skip,
      take: limit,
    }),

    prisma.leave.count({ where }),
  ]);

  /* ---------------- CALCULATE BALANCES ---------------- */

  const balances = {};

  for (const type in LEAVE_LIMITS) {
    balances[type] = {
      taken: 0,
      total: LEAVE_LIMITS[type],
      remaining: LEAVE_LIMITS[type],
    };
  }

  for (const leave of leaves) {
    if (leave.status !== "APPROVED") continue;

    const days = calculateLeaveDays(leave);

    if (!balances[leave.type]) {
      balances[leave.type] = {
        taken: 0,
        total: null,
        remaining: null,
      };
    }

    balances[leave.type].taken += days;

    if (balances[leave.type].total !== null) {
      balances[leave.type].remaining =
        balances[leave.type].total - balances[leave.type].taken;
    }
  }

  return {
    stats,
    leaves,
    leaveBalances: balances,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteApprovedLeaveService(id, adminId) {
  const leave = await prisma.leave.findUnique({
    where: { id },
  });

  if (!leave) throw new Error("Leave not found");
  if (leave.status !== "APPROVED")
    throw new Error("Only approved leaves can be deleted");

  const now = new Date();
  const start = new Date(leave.startDate);

  if (start <= now)
    throw new Error("Cannot delete approved leaves that have already started");

  await prisma.leave.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  //  Notify
  if (leave.userId !== adminId) {
    await notify({
      userId: leave.userId,
      type: "LEAVE_DELETED",
      title: "Leave deleted",
      message: "An approved leave was deleted by administration",
      entityId: leave.id,
      email: true,
    });
  }

  return "Approved leave deleted successfully";
}
