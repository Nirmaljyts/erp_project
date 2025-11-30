import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";

// LIST USERS (pagination + search)
export async function fetchUsersService(query) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "role", // default sort by role hierarchy
    order = "asc",
  } = query;

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [{ name: { contains: search } }, { email: { contains: search } }],
    }),
  };

  const skip = (Number(page) - 1) * Number(limit);

  // Fetch raw (unsorted if sorting by role)
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

  // *** Custom role priority ***
  const ROLE_ORDER = {
    ADMIN: 1,
    HR_MANAGER: 2,
    HR: 3,
    MANAGER: 4,
    EMPLOYEE: 5,
  };

  let data = rawData;

  // Apply custom role ordering only if sorting by "role"
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
// CREATE USER — with full ADMIN / HR_MANAGER restrictions
export async function createUserService(data) {
  const { name, email, password, role = "EMPLOYEE", isActive = true } = data;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  // ❌ Only ONE ADMIN allowed
  if (role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", deletedAt: null },
    });
    if (adminCount >= 1) {
      throw new Error("Only one ADMIN account is allowed");
    }
  }

  // ❌ Only ONE HR_MANAGER allowed
  if (role === "HR_MANAGER") {
    const count = await prisma.user.count({
      where: { role: "HR_MANAGER", deletedAt: null },
    });
    if (count >= 1) {
      throw new Error("Only one HR_MANAGER account is allowed");
    }
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
// UPDATE USER — full role protection rules
export async function updateUserService(id, data) {
  const existing = await prisma.user.findFirst({
    where: { id: Number(id), deletedAt: null },
  });

  if (!existing) throw new Error("User not found");

  // currentUser is passed in from controller
  const actingRole = data.currentUser?.role;
  const targetRole = existing.role;

  const updateData = {};

  // -------------------------------------------------
  // BASIC FIELD UPDATES
  // -------------------------------------------------
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (typeof data.isActive === "boolean") {
    updateData.isActive = data.isActive;
  }

  // -------------------------------------------------
  // ROLE CHANGE LOGIC
  // -------------------------------------------------
  if (data.role) {
    const newRole = data.role;

    // ❌ ADMIN role cannot be changed by anyone
    if (targetRole === "ADMIN") {
      throw new Error("ADMIN role cannot be changed");
    }

    // ❌ HR_MANAGER role can ONLY be changed by ADMIN
    if (targetRole === "HR_MANAGER" && actingRole !== "ADMIN") {
      throw new Error("Only ADMIN can modify HR_MANAGER role");
    }

    // ❌ Cannot create a 2nd ADMIN
    if (newRole === "ADMIN") {
      const count = await prisma.user.count({
        where: { role: "ADMIN", deletedAt: null },
      });
      if (count >= 1) {
        throw new Error("Only one ADMIN account is allowed");
      }
    }

    // ❌ Cannot create a 2nd HR_MANAGER
    if (newRole === "HR_MANAGER") {
      const count = await prisma.user.count({
        where: { role: "HR_MANAGER", deletedAt: null },
      });
      if (count >= 1) {
        throw new Error("Only one HR_MANAGER account is allowed");
      }
    }

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

// DELETE USER — full role restriction rules
export async function deleteUserService(id, currentUser) {
  const userId = Number(id);

  const targetUser = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, role: true, isActive: true },
  });

  if (!targetUser) throw new Error("User not found");

  const acting = currentUser.role;
  const target = targetUser.role;

  // ❌ Universal self-delete block
  if (currentUser.id === userId) {
    throw new Error("You cannot delete your own account");
  }

  // ----------------------------------------
  // ❌ ADMIN CANNOT BE DELETED
  // ----------------------------------------
  if (target === "ADMIN") {
    throw new Error("ADMIN account cannot be deleted");
  }

  // ----------------------------------------
  // ❌ HR_MANAGER DELETION RULES
  // ----------------------------------------
  if (target === "HR_MANAGER") {
    if (acting !== "ADMIN") {
      throw new Error("Only ADMIN can delete HR_MANAGER");
    }

    // Prevent deleting the only HR_MANAGER
    const count = await prisma.user.count({
      where: { role: "HR_MANAGER", deletedAt: null, isActive: true },
    });

    if (count <= 1) {
      throw new Error("Cannot delete the only HR_MANAGER account");
    }
  }

  // ----------------------------------------
  // ❌ HR RULES
  // ----------------------------------------
  if (acting === "HR") {
    if (["ADMIN", "HR_MANAGER", "HR"].includes(target)) {
      throw new Error("HR cannot delete Admin, HR Manager, or other HR users");
    }
    // HR can delete only MANAGER + EMPLOYEE
  }

  // ----------------------------------------
  // ❌ MANAGER / EMPLOYEE cannot delete anyone
  // ----------------------------------------
  if (acting === "MANAGER" || acting === "EMPLOYEE") {
    throw new Error("You are not allowed to delete users");
  }

  // ----------------------------------------
  // If ADMIN or HR_MANAGER deleting allowed roles → proceed
  // ----------------------------------------

  // remove project assignments
  await prisma.projectEmployee.deleteMany({
    where: { employeeId: userId },
  });

  // nullify project manager
  await prisma.project.updateMany({
    where: { managerId: userId },
    data: { managerId: null },
  });

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
