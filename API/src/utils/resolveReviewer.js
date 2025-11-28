import prisma from "./prisma.js";

export async function resolveReviewer(userId) {
    console.log("resolveReviewer CALLED for user:", userId);

  const activeProject = await prisma.projectEmployee.findFirst({
    where: {
      employeeId: userId,
      project: {
        deletedAt: null,
        status: { in: ["ACTIVE", "ON_HOLD"] },
      },
    },
    include: { project: true },
  });

  if (activeProject) {
    return activeProject.project.managerId;
  }

  // otherwise → HR
  const hr = await prisma.user.findFirst({
    where: { role: "HR", isActive: true, deletedAt: null },
  });

  return hr?.id ?? null;
}
