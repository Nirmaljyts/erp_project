import prisma from "../utils/prisma.js";

export async function getDashboardStatsService(user) {
  let projectWhere = { deletedAt: null };

  // MANAGER → only own managed projects OR projects they are assigned to
  if (user.role === "MANAGER") {
    projectWhere = {
      deletedAt: null,
      OR: [
        { managerId: user.id },
        { employees: { some: { employeeId: user.id } } }
      ]
    };
  }

  // EMPLOYEE → only projects they are assigned to
  else if (user.role === "EMPLOYEE") {
    projectWhere = {
      deletedAt: null,
      employees: { some: { employeeId: user.id } }
    };
  }

  // HR or HR_MANAGER → sees ALL projects
  // No special filtering needed because default is ALL

  // USER COUNT RULE
  let userWhere = {
    deletedAt: null,
    role: { not: "ADMIN" } // never show admin count
  };

  // MANAGER → cannot see HR / HR_MANAGER / ADMIN users
  if (user.role === "MANAGER") {
    userWhere = {
      deletedAt: null,
      role: { in: ["EMPLOYEE"] }
    };
  }

  // EMPLOYEE → should not see any users except themselves
  if (user.role === "EMPLOYEE") {
    userWhere = {
      id: user.id,
      deletedAt: null
    };
  }

  // CLIENT COUNT remains same
  const clientWhere = { deletedAt: null };

  const [projectCount, clientCount, userCount] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.client.count({ where: clientWhere }),
    prisma.user.count({ where: userWhere })
  ]);

  return {
    projects: projectCount,
    clients: clientCount,
    users: userCount
  };
}
