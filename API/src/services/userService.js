import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";

// --------------------------
// LIST USERS (Paginated)
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

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

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
export async function deleteUserService(id) {
  const userId = Number(id);

  // Remove employee assignments
  await prisma.projectEmployee.deleteMany({
    where: { employeeId: userId },
  });

  // Remove manager assignments
  await prisma.project.updateMany({
    where: { managerId: userId },
    data: { managerId: null }, // or throw error instead
  });

  // Delete user
  return prisma.user.delete({
    where: { id: userId },
  });
}

// ONLY MANAGERS
export async function getManagersService() {
  return prisma.user.findMany({
    where: {
      role: "MANAGER",
      isActive: true,
    },
    select: { id: true, name: true },
  });
}

// EMPLOYEES NOT ASSIGNED TO OTHER ACTIVE PROJECTS
export async function getAvailableEmployeesService(currentProjectId) {
  const projectId = Number(currentProjectId);

  // If creating a NEW project → return all employees that are not assigned to active projects
  if (!projectId || isNaN(projectId)) {
    return prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
        isActive: true,
        projects: {
          none: {
            project: {
              status: { in: ["ACTIVE", "ON_HOLD"] }
            }
          }
        }
      },
      select: { id: true, name: true }
    });
  }

  // Editing existing project → allow assigned employees + available ones
  const assignedToThisProject = await prisma.projectEmployee.findMany({
    where: { projectId },
    include: { employee: true }
  });

  const assignedEmployeeIds = assignedToThisProject.map(e => e.employeeId);

  const availableEmployees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      isActive: true,
      projects: {
        none: {
          project: {
            id: { not: projectId },
            status: { in: ["ACTIVE", "ON_HOLD"] }
          }
        }
      }
    },
    select: { id: true, name: true }
  });

  return [
    ...assignedToThisProject.map(e => ({
      id: e.employee.id,
      name: e.employee.name,
    })),
    ...availableEmployees.filter(e => !assignedEmployeeIds.includes(e.id)),
  ];
}

