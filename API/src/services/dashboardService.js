import prisma from "../utils/prisma.js";

export async function getDashboardStatsService(user) {
  let projectWhere = {};

  // PROJECT COUNT ROLE FILTERS
  if (user.role === "MANAGER") {
    projectWhere = {
      OR: [
        { managerId: user.id },
        { employees: { some: { employeeId: user.id } } },
      ],
    };
  }

  if (user.role === "EMPLOYEE") {
    projectWhere = {
      employees: { some: { employeeId: user.id } },
    };
  }

  // USER COUNT (Exclude Admins for EVERY ROLE)
  const userWhere = {
    // role: { not: "ADMIN" }
  };

  const [projectCount, clientCount, userCount] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.client.count(),
    prisma.user.count({ where: userWhere }), // Admin excluded
  ]);

  return {
    projects: projectCount,
    clients: clientCount,
    users: userCount,
  };
}
