import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";

// --------------------------
// LIST USERS
// --------------------------
export async function fetchUsersService(query) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "name",
    order = "asc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    // role: { not: "ADMIN" },
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const data = await prisma.user.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: { [sort]: order },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const total = await prisma.user.count({ where });

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

// --------------------------
// GET USER
// --------------------------
export async function fetchUserService(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
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

// --------------------------
// CREATE USER
// --------------------------
export async function createUserService(data) {
  const { name, email, password, role = "EMPLOYEE", isActive = true } = data;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const hashed = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      isActive,
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

// --------------------------
// UPDATE USER
// --------------------------
export async function updateUserService(id, data) {
  const { name, email, password, role, isActive } = data;

  const updateData = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email;

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  if (role) updateData.role = role;
  if (typeof isActive === "boolean") updateData.isActive = isActive;

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

// --------------------------
// DELETE USER
// --------------------------
export async function deleteUserService(id, currentUser) {
  const userId = Number(id);

  // Prevent invalid request
  if (!userId) {
    throw new Error("Invalid user ID");
  }

  const userToDelete = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!userToDelete) {
    throw new Error("User not found");
  }

  const actingRole = currentUser.role;
  const targetRole = userToDelete.role;

  // Rule 4: Managers & Employees cannot delete anyone
  if (actingRole !== "ADMIN" && actingRole !== "HR") {
    throw new Error("You are not allowed to delete users");
  }

  // Rule 3: Cannot delete yourself
  if (currentUser.id === userId) {
    throw new Error("You cannot delete your own account");
  }

  // Rule 2 + 5: Admin deletion restrictions
  if (targetRole === "ADMIN") {
    if (actingRole !== "ADMIN") {
      throw new Error("Only Admins can delete admins");
    }

    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });

    if (activeAdmins <= 1) {
      throw new Error("Cannot delete the last active Admin");
    }
  }

  // Remove user from projects
  await prisma.projectEmployee.deleteMany({
    where: { employeeId: userId },
  });

  // Remove manager assignment
  await prisma.project.updateMany({
    where: { managerId: userId },
    data: { managerId: null },
  });

  // Delete user
  return prisma.user.delete({
    where: { id: userId },
  });
}

// ONLY MANAGERS
export async function getManagersService(user) {
  // Manager → only himself
  if (user.role === "MANAGER") {
    return prisma.user.findMany({
      where: {
        id: user.id,
        role: "MANAGER",
        isActive: true,
      },
      select: { id: true, name: true },
    });
  }

  // Employee → no access to managers
  if (user.role === "EMPLOYEE") {
    return [];
  }

  // Admin or HR → see all active managers
  return prisma.user.findMany({
    where: {
      role: "MANAGER",
      isActive: true,
    },
    select: { id: true, name: true },
  });
}

// EMPLOYEES AVAILABLE FOR ASSIGNMENT BASED ON PROJECT STATUS
export async function getAvailableEmployeesService(currentProjectId) {
  const projectId = Number(currentProjectId);

  // Common query → exclude employees in ACTIVE/ON_HOLD projects
  const excludeActiveProjects = {
    role: "EMPLOYEE",
    isActive: true,
    projects: {
      none: {
        project: {
          status: { in: ["ACTIVE", "ON_HOLD"] },
          ...(projectId && { id: { not: projectId } }), // allow current project
        },
      },
    },
  };

  // NEW PROJECT → No assigned base
  if (!projectId || isNaN(projectId)) {
    return prisma.user.findMany({
      where: excludeActiveProjects,
      select: { id: true, name: true },
    });
  }

  // EDIT PROJECT
  const assigned = await prisma.projectEmployee.findMany({
    where: { projectId },
    include: { employee: true },
  });

  const assignedIds = assigned.map((a) => a.employeeId);

  const available = await prisma.user.findMany({
    where: excludeActiveProjects,
    select: { id: true, name: true },
  });

  return [
    // those already in this project
    ...assigned.map((a) => ({
      id: a.employee.id,
      name: a.employee.name,
    })),
    // prevent duplication
    ...available.filter((a) => !assignedIds.includes(a.id)),
  ];
}

