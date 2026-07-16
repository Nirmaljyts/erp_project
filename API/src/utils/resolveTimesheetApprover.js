import prisma from "./prisma.js";

export async function resolveTimesheetApprover(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  if (!user) return null;

  const findFirstActive = (role) =>
    prisma.user.findFirst({
      where: { role, isActive: true, deletedAt: null },
      orderBy: { id: "asc" },
    });

  // 1) EMPLOYEE → Project MANAGER (if any active) else HR_MANAGER, else ADMIN
  if (user.role === "EMPLOYEE") {
    const activeProject = user.projects.find((p) =>
      ["ACTIVE", "ON_HOLD"].includes(p.project.status)
    );

    if (activeProject?.project?.managerId) {
      return activeProject.project.managerId;
    }

    const hrm = await findFirstActive("HR_MANAGER");
    if (hrm) return hrm.id;

    const admin = await findFirstActive("ADMIN");
    return admin?.id ?? null;
  }

  // 2) MANAGER and HR → HR_MANAGER, else ADMIN
  if (user.role === "MANAGER" || user.role === "HR") {
    const hrm = await findFirstActive("HR_MANAGER");
    if (hrm) return hrm.id;

    const admin = await findFirstActive("ADMIN");
    return admin?.id ?? null;
  }

  // 3) HR_MANAGER → ADMIN
  if (user.role === "HR_MANAGER") {
    const admin = await findFirstActive("ADMIN");
    return admin?.id ?? null;
  }

  // 4) ADMIN → self
  if (user.role === "ADMIN") {
    return user.id;
  }

  return null;
}
