import prisma from "../utils/prisma.js";

export async function getDashboardStatsService(user) {
  // PROJECTS
  let projectWhere = { deletedAt: null };

  if (user.role === "MANAGER") {
    projectWhere = {
      deletedAt: null,
      OR: [
        { managerId: user.id },
        { employees: { some: { employeeId: user.id } } },
      ],
    };
  }

  if (user.role === "EMPLOYEE") {
    projectWhere = {
      deletedAt: null,
      employees: { some: { employeeId: user.id } },
    };
  }

  // USERS COUNT (exclude admin + exclude soft-deleted)
  const userWhere = {
    deletedAt: null,
    role: { not: "ADMIN" },
  };

  // CLIENTS COUNT (exclude soft-deleted)
  const clientWhere = {
    deletedAt: null,
  };

  const [projectCount, clientCount, userCount] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.client.count({ where: clientWhere }),
    prisma.user.count({ where: userWhere }),
  ]);

  return {
    projects: projectCount,
    clients: clientCount,
    users: userCount,
  };
}
