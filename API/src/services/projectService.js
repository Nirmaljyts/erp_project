import prisma from "../utils/prisma.js";

// -----------------------------------
// LIST PROJECTS
// -----------------------------------
export async function getAllProjects(query) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "name",
    order = "asc",
  } = query;

  const skip = (page - 1) * limit;

  const where = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

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
export function createNewProject(data) {
  const { name, description, status, managerId, employees = [] } = data;

  return prisma.project.create({
    data: {
      name,
      description,
      status,
      managerId: managerId || null,
      employees: {
        create: employees.map((id) => ({ employeeId: id })),
      },
    },
  });
}

// -----------------------------------
// UPDATE PROJECT
// -----------------------------------
export function updateExistingProject(id, data) {
  const { name, description, status, managerId, employees = [] } = data;

  return prisma.project.update({
    where: { id: Number(id) },
    data: {
      name,
      description,
      status,
      managerId: managerId || null,
      employees: {
        deleteMany: {},
        create: employees.map((eId) => ({ employeeId: eId })),
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
    where: { projectId }
  });

  // 2. Remove manager association
  await prisma.project.update({
    where: { id: projectId },
    data: { managerId: null }
  });

  // 3. Delete project
  return prisma.project.delete({
    where: { id: projectId }
  });
}

// -----------------------------------
// VALIDATE EMPLOYEE ASSIGNMENTS
// -----------------------------------
async function validateEmployeeAssignment(employeeId, projectId) {
  const existing = await prisma.projectEmployee.findMany({
    where: { employeeId },
    include: {
      project: true,
    },
  });

  for (const rec of existing) {
    if (
      rec.project.id !== Number(projectId) &&
      rec.project.status !== "COMPLETED" &&
      rec.project.status !== "CANCELLED"
    ) {
      throw new Error(
        `Employee already assigned to active project: ${rec.project.name}`
      );
    }
  }
}

// -----------------------------------
// ASSIGN USERS
// -----------------------------------
export async function assignUsersService(projectId, data) {
  const { managerId, employees = [] } = data;

  if (!managerId) throw new Error("Manager is required");

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
    include: {
      manager: true,
      employees: { include: { employee: true } },
    },
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
