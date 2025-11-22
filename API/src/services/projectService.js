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

// -----------------------------------
// CREATE PROJECT
// -----------------------------------
export function createNewProject(data, user) {
  if (user.role === "MANAGER") {
    data.managerId = user.id; // force their own ID
  }
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      managerId: data.managerId,
      employees: {
        create: data.employees.map((id) => ({ employeeId: id })),
      },
    },
  });
}

// -----------------------------------
// UPDATE PROJECT
// -----------------------------------
export function updateExistingProject(id, data, user) {
  if (user.role === "MANAGER") {
    data.managerId = user.id;
  }

  return prisma.project.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      managerId: data.managerId,
      employees: {
        deleteMany: {},
        create: data.employees.map((eId) => ({ employeeId: eId })),
      },
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
  return prisma.project.update({
    where: { id: Number(projectId) },
    data: { status },
  });
}
