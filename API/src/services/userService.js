import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";

/* ============================================================
   ROLE PRIORITY CHAIN (for reviewer fallback)
============================================================ */
const ESCALATION = {
  EMPLOYEE: ["MANAGER", "HR", "HR_MANAGER", "ADMIN"],
  MANAGER: ["HR", "HR_MANAGER", "ADMIN"],
  HR: ["HR_MANAGER", "ADMIN"],
  HR_MANAGER: ["ADMIN"],
  ADMIN: ["ADMIN"],
};

/* ============================================================
   UTILITY — FIND NEXT REVIEWER IN CHAIN
============================================================ */
async function findNextReviewerByRole(role) {
  const chain = ESCALATION[role];

  for (const nextRole of chain) {
    const user = await prisma.user.findFirst({
      where: { role: nextRole, isActive: true, deletedAt: null },
      orderBy: { id: "asc" },
    });

    if (user) return user.id;
  }

  return null;
}

/* ============================================================
   UTILITY — REASSIGN PENDING LEAVES OF REMOVED/UPDATED USER
============================================================ */
async function reassignPendingLeaves(oldReviewerId, oldRole) {
  const nextReviewer = await findNextReviewerByRole(oldRole);
  if (!nextReviewer) return;

  await prisma.leave.updateMany({
    where: {
      approvedById: oldReviewerId,
      status: "PENDING",
      deletedAt: null,
    },
    data: { approvedById: nextReviewer },
  });
}

/* ============================================================
   LIST USERS (pagination + search)
============================================================ */
export async function fetchUsersService(query) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "role",
    order = "asc",
  } = query;

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [{ name: { contains: search } }, { email: { contains: search } }],
    }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [rawData, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: sort !== "role" ? { [sort]: order } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const ROLE_ORDER = {
    ADMIN: 1,
    HR_MANAGER: 2,
    HR: 3,
    MANAGER: 4,
    EMPLOYEE: 5,
  };

  let data = rawData;

  if (sort === "role") {
    data = rawData.sort((a, b) => {
      const diff = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
      return order === "asc" ? diff : -diff;
    });
  }

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

/* ============================================================
   GET ONE USER
============================================================ */
export async function fetchUserService(id) {
  return prisma.user.findFirst({
    where: { id: Number(id), deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/* ============================================================
   CREATE USER (with restrictions)
============================================================ */
export async function createUserService(data) {
  const { name, email, password, role = "EMPLOYEE", isActive = true } = data;

  if (!name || !email || !password)
    throw new Error("Name, email and password are required");

  // Only one ADMIN
  if (role === "ADMIN") {
    const count = await prisma.user.count({
      where: { role: "ADMIN", deletedAt: null },
    });
    if (count >= 1) throw new Error("Only one ADMIN is allowed");
  }

  // Only one HR_MANAGER
  if (role === "HR_MANAGER") {
    const count = await prisma.user.count({
      where: { role: "HR_MANAGER", deletedAt: null },
    });
    if (count >= 1) throw new Error("Only one HR_MANAGER is allowed");
  }

  const hashed = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      isActive,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/* ============================================================
   UPDATE USER (with auto-leave reassignment)
============================================================ */
export async function updateUserService(id, data) {
  const existing = await prisma.user.findFirst({
    where: { id: Number(id), deletedAt: null },
  });

  if (!existing) throw new Error("User not found");

  const actingRole = data.currentUser?.role;
  const targetRole = existing.role;

  const updateData = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

  if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;

  /* --------- ROLE CHANGE HANDLING --------- */
  if (data.role && data.role !== existing.role) {
    const newRole = data.role;

    if (targetRole === "ADMIN") throw new Error("ADMIN role cannot be changed");

    if (targetRole === "HR_MANAGER" && actingRole !== "ADMIN")
      throw new Error("Only ADMIN can modify HR_MANAGER role");

    if (newRole === "ADMIN") {
      const count = await prisma.user.count({
        where: { role: "ADMIN", deletedAt: null },
      });
      if (count >= 1) throw new Error("Only one ADMIN account allowed");
    }

    if (newRole === "HR_MANAGER") {
      const count = await prisma.user.count({
        where: { role: "HR_MANAGER", deletedAt: null },
      });
      if (count >= 1) throw new Error("Only one HR_MANAGER allowed");
    }

    // AUTO REALLOCATE LEAVES
    await reassignPendingLeaves(existing.id, existing.role);

    updateData.role = newRole;
  }

  return prisma.user.update({
    where: { id: Number(id) },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/* ============================================================
   DELETE USER (with auto-leave reassignment)
============================================================ */
export async function deleteUserService(id, currentUser) {
  const userId = Number(id);

  const target = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, isActive: true },
  });

  if (!target) throw new Error("User not found");

  if (currentUser.id === userId) throw new Error("You cannot delete yourself");

  if (target.role === "ADMIN") throw new Error("ADMIN cannot be deleted");

  if (target.role === "HR_MANAGER") {
    if (currentUser.role !== "ADMIN")
      throw new Error("Only ADMIN can delete HR_MANAGER");

    const count = await prisma.user.count({
      where: { role: "HR_MANAGER", deletedAt: null, isActive: true },
    });

    if (count <= 1) throw new Error("Cannot delete the only HR_MANAGER");
  }

  if (
    currentUser.role === "HR" &&
    ["ADMIN", "HR_MANAGER", "HR"].includes(target.role)
  ) {
    throw new Error("HR cannot delete Admin / HR Manager / HR");
  }

  if (["MANAGER", "EMPLOYEE"].includes(currentUser.role)) {
    throw new Error("You are not allowed to delete users");
  }

  /* --------- AUTO-REALLOCATE LEAVES --------- */
  await reassignPendingLeaves(userId, target.role);

  // remove project assignments
  await prisma.projectEmployee.deleteMany({
    where: { employeeId: userId },
  });

  // unset manager in projects
  await prisma.project.updateMany({
    where: { managerId: userId },
    data: { managerId: null },
  });

  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isActive: false },
  });
}

/* ============================================================
   GET MANAGERS (unchanged)
============================================================ */
export async function getManagersService(user) {
  if (user.role === "MANAGER") {
    return prisma.user.findMany({
      where: {
        id: user.id,
        role: "MANAGER",
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, name: true },
    });
  }

  if (user.role === "EMPLOYEE") return [];

  return prisma.user.findMany({
    where: {
      role: "MANAGER",
      deletedAt: null,
      isActive: true,
    },
    select: { id: true, name: true },
  });
}

/* ============================================================
   GET AVAILABLE EMPLOYEES FOR PROJECT
============================================================ */
export async function getAvailableEmployeesService(currentProjectId) {
  const projectId = Number(currentProjectId);

  const baseWhere = {
    role: "EMPLOYEE",
    deletedAt: null,
    isActive: true,
    projects: {
      none: {
        project: {
          deletedAt: null,
          status: { in: ["ACTIVE", "ON_HOLD"] },
          ...(projectId && { id: { not: projectId } }),
        },
      },
    },
  };

  if (!projectId || isNaN(projectId)) {
    return prisma.user.findMany({
      where: baseWhere,
      select: { id: true, name: true },
    });
  }

  const assigned = await prisma.projectEmployee.findMany({
    where: { projectId },
    include: { employee: true },
  });

  const assignedIds = assigned.map((x) => x.employeeId);

  const available = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true, name: true },
  });

  return [
    ...assigned.map((x) => ({ id: x.employee.id, name: x.employee.name })),
    ...available.filter((a) => !assignedIds.includes(a.id)),
  ];
}
