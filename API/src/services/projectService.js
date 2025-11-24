import prisma from "../utils/prisma.js";

// -----------------------------------
// LIST PROJECTS
// -----------------------------------
export async function getAllProjects(query, user) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "status",
    order = "asc",
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const whereSearch = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

  let where = { ...whereSearch };

  // Role-based filters
  if (user.role === "ADMIN" || user.role === "HR") {
    // See all projects → no role filter
  } else if (user.role === "MANAGER") {
    where.OR = [
      { managerId: user.id },
      {
        employees: {
          some: { employeeId: user.id },
        },
      },
    ];
  } else if (user.role === "EMPLOYEE") {
    where = {
      ...whereSearch,
      employees: {
        some: { employeeId: user.id },
      },
    };
  }

  const data = await prisma.project.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: { [sort]: order },
    include: {
      manager: { select: { id: true, name: true } },
      employees: { include: { employee: true } },
    },
  });

  const total = await prisma.project.count({ where });

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

// -----------------------------------
// SINGLE PROJECT
// -----------------------------------
export function getProjectById(id) {
  return prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      manager: true,
      employees: { include: { employee: true } },
    },
  });
}

export async function validateEmployeesForProject(
  projectId,
  employees,
  targetStatus
) {
  const pid = projectId ? Number(projectId) : null;

  // Allow if switching to Completed/Cancelled OR status unchanged
  if (!["ACTIVE", "ON_HOLD"].includes(targetStatus)) {
    return true;
  }

  // Get current project status (if editing)
  let currentStatus = null;
  if (pid) {
    const project = await prisma.project.findUnique({
      where: { id: pid },
      select: { status: true },
    });

    currentStatus = project?.status;

    // If changing to same status → OK
    if (currentStatus === targetStatus) {
      return true;
    }
  }

  for (const empId of employees) {
    const conflict = await prisma.projectEmployee.findFirst({
      where: {
        employeeId: empId,
        ...(pid ? { projectId: { not: pid } } : {}),
        project: {
          status: { in: ["ACTIVE", "ON_HOLD"] },
        },
      },
      include: {
        employee: { select: { name: true } },
        project: { select: { name: true, status: true } },
      },
    });

    if (conflict) {
      throw new Error(
        `Cannot set this project to ${targetStatus}. 
        Employee "${conflict.employee.name}" already assigned to an "${conflict.project.status}" project "${conflict.project.name}".`
      );
    }
  }

  return true;
}

// -----------------------------------
// CREATE PROJECT
// -----------------------------------
export async function createNewProject(data, user) {
  const {
    name,
    description,
    status,
    managerId,
    employees = [],
    startDate,
    endDate,
  } = data;

  if (!startDate || !endDate) {
    throw new Error("Start and End dates are required");
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new Error("End date must be greater than start date");
  }

  // Managers can assign only themselves as manager
  const finalManagerId = user.role === "MANAGER" ? user.id : managerId;

  return prisma.project.create({
    data: {
      name,
      description,
      status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      managerId: finalManagerId || null,
      employees: {
        create: employees.map((id) => ({ employeeId: id })),
      },
    },
    include: {
      manager: true,
      employees: true,
    },
  });
}

// -----------------------------------
// UPDATE PROJECT
// -----------------------------------
export async function updateExistingProject(id, data, user) {
  const {
    name,
    description,
    status,
    managerId,
    employees = [],
    startDate,
    endDate,
  } = data;

  if (!startDate || !endDate) {
    throw new Error("Start and End dates are required");
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new Error("End date must be greater than start date");
  }

  const finalManagerId = user.role === "MANAGER" ? user.id : managerId;

  // 🔥 Enforce validation BEFORE database update
  await validateEmployeesForProject(id, employees, status);

  return prisma.project.update({
    where: { id: Number(id) },
    data: {
      name,
      description,
      status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      managerId: finalManagerId || null,
      employees: {
        deleteMany: {},
        create: employees.map((eId) => ({ employeeId: eId })),
      },
    },
    include: {
      manager: true,
      employees: true,
    },
  });
}

// -----------------------------------
// DELETE PROJECT
// -----------------------------------
export async function deleteProjectService(id) {
  const projectId = Number(id);

  // 1. Remove employee assignments
  await prisma.projectEmployee.deleteMany({
    where: { projectId },
  });

  // 2. Remove manager association
  await prisma.project.update({
    where: { id: projectId },
    data: { managerId: null },
  });

  // 3. Delete project
  return prisma.project.delete({
    where: { id: projectId },
  });
}

// -----------------------------------
// VALIDATE EMPLOYEE ASSIGNMENTS
// -----------------------------------
async function validateEmployeeAssignment(employeeId, projectId) {
  const existing = await prisma.projectEmployee.findFirst({
    where: {
      employeeId: Number(employeeId),
      projectId: Number(projectId),
    },
  });

  if (existing) return true; // already assigned here → OK

  return true; // allow multiple active project assignments
}

// -----------------------------------
// ASSIGN USERS
// -----------------------------------
export async function assignUsersService(projectId, data, user) {
  const { managerId, employees = [] } = data;

  if (!managerId) throw new Error("Manager is required");

  // ❌ Manager cannot assign another manager
  if (user.role === "MANAGER" && managerId !== user.id) {
    throw new Error("Managers can only assign projects to employees");
  }

  for (const empId of employees) {
    await validateEmployeeAssignment(empId, projectId);
  }

  return prisma.project.update({
    where: { id: Number(projectId) },
    data: {
      managerId,
      employees: {
        deleteMany: {},
        create: employees.map((eId) => ({ employeeId: eId })),
      },
    },
    include: { manager: true, employees: { include: { employee: true } } },
  });
}

// -----------------------------------
// REMOVE EMPLOYEE
// -----------------------------------
export async function removeEmployeeFromProjectService(projectId, employeeId) {
  return prisma.projectEmployee.deleteMany({
    where: {
      projectId: Number(projectId),
      employeeId: Number(employeeId),
    },
  });
}

// -----------------------------------
// UPDATE STATUS
// -----------------------------------
export async function updateProjectStatusService(projectId, status) {
  const newStatusIsActive = ["ACTIVE", "ON_HOLD"].includes(status);

  if (newStatusIsActive) {
    // Find employees assigned to this project
    const assignedEmployees = await prisma.projectEmployee.findMany({
      where: { projectId: Number(projectId) },
      select: { employeeId: true },
    });

    // Check each employee to ensure they aren't in another active project
    for (const { employeeId } of assignedEmployees) {
      const conflict = await prisma.projectEmployee.findFirst({
        where: {
          employeeId,
          projectId: { not: Number(projectId) },
          project: {
            status: { in: ["ACTIVE", "ON_HOLD"] },
          },
        },
        include: {
          project: { select: { name: true } },
          employee: { select: { name: true } },
        },
      });

      if (conflict) {
        throw new Error(
          `Employee "${conflict.employee.name}" is already assigned to ACTIVE/ON_HOLD project "${conflict.project.name}". Remove them first.`
        );
      }
    }
  }

  return prisma.project.update({
    where: { id: Number(projectId) },
    data: { status },
  });
}
