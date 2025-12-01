import prisma from "../utils/prisma.js";
import { resolveReviewer } from "../utils/resolveReviewer.js";
import { updateReviewersForProject } from "../utils/updateReviewersForProject.js";

// LIST PROJECTS
export async function getAllProjects(query, user) {
  const {
    search = "",
    page = 1,
    limit = 10,
    sort = "status",
    order = "asc",
  } = query;

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const cleanSearch = search.trim();
  const whereSearch = cleanSearch ? { name: { contains: cleanSearch } } : {};

  let where = {
    deletedAt: null,
    ...whereSearch,
  };

  if (user.role === "MANAGER") {
    where.OR = [
      { managerId: user.id },
      { employees: { some: { employeeId: user.id } } },
    ];
  }

  if (user.role === "EMPLOYEE") {
    where = {
      deletedAt: null,
      ...whereSearch,
      employees: { some: { employeeId: user.id } },
    };
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
      include: {
        manager: { select: { id: true, name: true } },
        employees: {
          include: {
            employee: { select: { id: true, name: true, deletedAt: true } },
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// GET SINGLE PROJECT
export async function getProjectById(id, user) {
  return prisma.project.findFirst({
    where: {
      id: Number(id),
      deletedAt: null,
    },
    include: {
      manager: true,
      employees: { include: { employee: true } },
    },
  });
}

// VALIDATE EMPLOYEES BEFORE CREATE/UPDATE
export async function validateEmployeesForProject(
  projectId,
  employees,
  targetStatus
) {
  if (!["ACTIVE", "ON_HOLD"].includes(targetStatus)) return true;

  const pid = projectId ? Number(projectId) : null;

  let currentStatus = null;

  if (pid) {
    const project = await prisma.project.findFirst({
      where: { id: pid, deletedAt: null },
      select: { status: true },
    });

    if (!project) throw new Error("Project not found");
    currentStatus = project.status;
    if (currentStatus === targetStatus) return true;
  }

  for (const empId of employees) {
    const conflict = await prisma.projectEmployee.findFirst({
      where: {
        employeeId: empId,
        ...(pid ? { projectId: { not: pid } } : {}),
        project: {
          deletedAt: null,
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
        `Employee "${conflict.employee.name}" is already in "${conflict.project.status}" project "${conflict.project.name}".`
      );
    }
  }

  return true;
}

// CREATE PROJECT
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

  if (!startDate || !endDate)
    throw new Error("Start and End dates are required");

  if (new Date(startDate) >= new Date(endDate))
    throw new Error("End date must be greater than start date");

  const finalManagerId = user.role === "MANAGER" ? user.id : managerId;

  // Validate MANAGER is active & not deleted
  const manager = await prisma.user.findFirst({
    where: {
      id: finalManagerId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (!manager) {
    throw new Error(
      "Assigned manager is inactive or deleted. Replace the manager before saving."
    );
  }

  // Validate EMPLOYEES are active & not deleted
  if (employees.length > 0) {
    const activeEmployees = await prisma.user.findMany({
      where: {
        id: { in: employees },
        role: "EMPLOYEE",
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    const activeIds = activeEmployees.map((u) => u.id);
    const inactiveIds = employees.filter((id) => !activeIds.includes(id));

    if (inactiveIds.length > 0) {
      const inactiveUsers = await prisma.user.findMany({
        where: { id: { in: inactiveIds } },
        select: { name: true },
      });

      const names = inactiveUsers.map((u) => u.name).join(", ");

      throw new Error(
        `Cannot assign inactive user(s): ${names}. Remove them before saving or reactivate the user(s).`
      );
    }
  }

  // Validate employee conflicts
  await validateEmployeesForProject(null, employees, status);

  const project = await prisma.project.create({
    data: {
      name,
      description,
      status,
      deletedAt: null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      managerId: finalManagerId || null,
      employees: {
        create: employees.map((id) => ({
          employeeId: id,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })),
      },
    },
    include: { manager: true, employees: true },
  });

  // 🔥 After project + employees are created, update leave reviewers
  await updateReviewersForProject(project.id);

  return project;
}

export async function updateExistingProject(id, data, user) {
  const projectId = Number(id);

  const existing = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!existing) throw new Error("Project not found");

  const {
    name,
    description,
    status,
    managerId,
    employees = [],
    startDate,
    endDate,
  } = data;

  if (!startDate || !endDate)
    throw new Error("Start and End dates are required");

  if (new Date(startDate) >= new Date(endDate))
    throw new Error("End date must be greater than start date");

  const finalManagerId = user.role === "MANAGER" ? user.id : managerId;

  // Validate manager is active
  const manager = await prisma.user.findFirst({
    where: {
      id: finalManagerId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (!manager) {
    throw new Error(
      "Assigned manager is inactive or deleted. Replace the manager before saving."
    );
  }

  // Validate employees are active
  if (employees.length > 0) {
    const activeEmployees = await prisma.user.findMany({
      where: {
        id: { in: employees },
        role: "EMPLOYEE",
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    const activeIds = activeEmployees.map((u) => u.id);
    const inactiveIds = employees.filter((id) => !activeIds.includes(id));

    if (inactiveIds.length > 0) {
      const inactiveUsers = await prisma.user.findMany({
        where: { id: { in: inactiveIds } },
        select: { name: true },
      });

      const names = inactiveUsers.map((u) => u.name).join(", ");

      throw new Error(
        `Cannot assign inactive user(s): ${names}. Remove them before saving or reactivate the user(s).`
      );
    }
  }

  // employee assignment validation
  await validateEmployeesForProject(projectId, employees, status);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description,
      status,
      deletedAt: null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      managerId: finalManagerId || null,
      employees: {
        deleteMany: { projectId: projectId },
        create: employees.map((eId) => ({
          employeeId: eId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        })),
      },
    },
    include: { manager: true, employees: true },
  });

  // 🔥 Project status / employees / manager changed → update reviewers
  await updateReviewersForProject(projectId);

  return updated;
}

// DELETE PROJECT
export async function deleteProjectService(id) {
  const projectId = Number(id);

  const existing = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });

  if (!existing) throw new Error("Project not found");

  // Remove employee relations
  await prisma.projectEmployee.deleteMany({
    where: { projectId },
  });

  // Soft delete project
  const deleted = await prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });

  // 🔥 Employees now effectively benched → reviewers must become HR
  // We don't know employees here anymore; best effort:
  // Any pending leaves for users who no longer have active/on_hold projects
  // will be corrected next time resolveReviewer is used or via a batch script.

  return deleted;
}

// ASSIGN USERS
export async function assignUsersService(projectId, data, user) {
  const pid = Number(projectId);

  const existing = await prisma.project.findFirst({
    where: { id: pid, deletedAt: null },
  });
  if (!existing) throw new Error("Project not found");

  const { managerId, employees = [] } = data;

  if (!managerId) throw new Error("Manager is required");

  // -----------------------------------------------------------
  // 1. Validate MANAGER (submitted + existing)
  // -----------------------------------------------------------
  const manager = await prisma.user.findFirst({
    where: {
      id: managerId,
      deletedAt: null,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (!manager) {
    throw new Error(
      "Assigned manager is inactive or deleted. Remove or replace them before saving."
    );
  }

  // -----------------------------------------------------------
  // 2. Get EXISTING assigned employees
  // -----------------------------------------------------------
  const existingAssignments = await prisma.projectEmployee.findMany({
    where: { projectId: pid },
    include: { employee: true },
  });

  const existingAssignedIds = existingAssignments.map((a) => a.employeeId);

  // -----------------------------------------------------------
  // 3. Combine submitted + existing employees
  // -----------------------------------------------------------
  const finalEmployeeIds = Array.from(
    new Set([...existingAssignedIds, ...employees])
  );

  // -----------------------------------------------------------
  // 4. Validate ALL employees (existing + submitted)
  // -----------------------------------------------------------
  const activeEmployees = await prisma.user.findMany({
    where: {
      id: { in: finalEmployeeIds },
      role: "EMPLOYEE",
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });

  const activeIds = activeEmployees.map((e) => e.id);

  const inactiveIds = finalEmployeeIds.filter((id) => !activeIds.includes(id));

  if (inactiveIds.length > 0) {
    const inactiveUsers = await prisma.user.findMany({
      where: { id: { in: inactiveIds } },
      select: { name: true },
    });

    const names = inactiveUsers.map((u) => u.name).join(", ");

    throw new Error(
      `Cannot assign inactive user(s) ${names} to this project. Remove them before saving or reactivate the user(s).`
    );
  }

  // -----------------------------------------------------------
  // 5. Safe to update
  // -----------------------------------------------------------
  const updated = await prisma.project.update({
    where: { id: pid },
    data: {
      managerId,
      employees: {
        deleteMany: {},
        create: employees.map((eId) => ({ employeeId: eId })),
      },
    },
    include: { manager: true, employees: { include: { employee: true } } },
  });

  // 🔥 FIX: update all employee reviewers under this project
  await updateReviewersForProject(pid);

  return updated;
}

// REMOVE EMPLOYEE
// REMOVE EMPLOYEE
// REMOVE EMPLOYEE
export async function removeEmployeeFromProjectService(projectId, employeeId) {
  const pid = Number(projectId);
  const eid = Number(employeeId);

  // Remove assignment
  await prisma.projectEmployee.deleteMany({
    where: { projectId: pid, employeeId: eid },
  });

  // Resolve reviewer (HR if benched)
  const newReviewer = await resolveReviewer(eid);

  // Update pending leaves
  await prisma.leave.updateMany({
    where: { userId: eid, status: "PENDING", deletedAt: null },
    data: { approvedById: newReviewer },
  });

  return { success: true };
}

// UPDATE STATUS
export async function updateProjectStatusService(projectId, status) {
  const pid = Number(projectId);

  const project = await prisma.project.findFirst({
    where: { id: pid, deletedAt: null },
  });

  if (!project) throw new Error("Project not found");

  const activating = ["ACTIVE", "ON_HOLD"].includes(status);

  if (activating) {
    const assignedEmployees = await prisma.projectEmployee.findMany({
      where: { projectId: pid },
      select: { employeeId: true },
    });

    for (const { employeeId } of assignedEmployees) {
      const conflict = await prisma.projectEmployee.findFirst({
        where: {
          employeeId,
          projectId: { not: pid },
          project: {
            deletedAt: null,
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
          `Employee "${conflict.employee.name}" is already in ACTIVE/ON_HOLD project "${conflict.project.name}". Remove them first.`
        );
      }
    }
  }

  const updated = await prisma.project.update({
    where: { id: pid },
    data: { status },
  });

  // 🔥 Status change affects who manages employees (manager vs HR)
  await updateReviewersForProject(pid);

  return updated;
}
