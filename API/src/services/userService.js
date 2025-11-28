import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";

// LIST USERS (pagination + search)
export async function fetchUsersService(query) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "status",
    order = "asc",
  } = query;

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [{ name: { contains: search } }, { email: { contains: search } }],
    }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.user.count({ where }),
  ]);

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

// GET ALL USERS
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

// CREATE USER
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

// UPDATE USER
export async function updateUserService(id, data) {
  const existing = await prisma.user.findFirst({
    where: { id: Number(id), deletedAt: null },
  });

  if (!existing) throw new Error("User not found");

  const updateData = {};

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.role) updateData.role = data.role;

  if (typeof data.isActive === "boolean") {
    updateData.isActive = data.isActive;
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

// DELETE USER (Soft Delete + Secure Rules)
export async function deleteUserService(id, currentUser) {
  const userId = Number(id);

  if (!userId) throw new Error("Invalid user ID");

  const userToDelete = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, isActive: true },
  });

  if (!userToDelete) {
    throw new Error("User not found");
  }

  const acting = currentUser.role;
  const target = userToDelete.role;

  // Only ADMIN or HR can delete anyone
  if (acting !== "ADMIN" && acting !== "HR") {
    throw new Error("You are not allowed to delete users");
  }

  // Cannot delete yourself
  if (currentUser.id === userId) {
    throw new Error("You cannot delete your own account");
  }

  // Special rules for Admin deletion
  if (target === "ADMIN") {
    if (acting !== "ADMIN") {
      throw new Error("Only Admins can delete admins");
    }

    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", deletedAt: null, isActive: true },
    });

    if (activeAdmins <= 1) {
      throw new Error("Cannot delete the last active Admin");
    }
  }

  // Remove user assignments in projects
  await prisma.projectEmployee.deleteMany({
    where: { employeeId: userId },
  });

  // Nullify manager relation in projects
  await prisma.project.updateMany({
    where: { managerId: userId },
    data: { managerId: null },
  });

  // Soft delete the user
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isActive: false },
  });
}

// LIST MANAGERS FOR PROJECT ASSIGNMENT
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

// GET AVAILABLE EMPLOYEES FOR PROJECT ASSIGNMENT
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

  // New project → return all available employees
  if (!projectId || isNaN(projectId)) {
    return prisma.user.findMany({
      where: baseWhere,
      select: { id: true, name: true },
    });
  }

  // Editing existing project
  const currentlyAssigned = await prisma.projectEmployee.findMany({
    where: { projectId },
    include: { employee: true },
  });

  const assignedIds = currentlyAssigned.map((x) => x.employeeId);

  const available = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true, name: true },
  });

  return [
    ...currentlyAssigned.map((x) => ({
      id: x.employee.id,
      name: x.employee.name,
    })),
    ...available.filter((a) => !assignedIds.includes(a.id)),
  ];
}
