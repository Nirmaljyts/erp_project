import prisma from "./prisma.js";

export async function resolveReviewer(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  if (!user) return null;

  // 1️⃣ EMPLOYEE → Manager OR HR_MANAGER
  if (user.role === "EMPLOYEE") {
    const activeProject = user.projects.find((p) =>
      ["ACTIVE", "ON_HOLD"].includes(p.project.status)
    );

    if (activeProject?.project?.managerId) {
      return activeProject.project.managerId;
    }

    // fallback → HR_MANAGER
    const hrm = await prisma.user.findFirst({
      where: { role: "HR_MANAGER", isActive: true, deletedAt: null },
    });

    return hrm?.id ?? null;
  }

  // 2️⃣ MANAGER → HR_MANAGER approves
  if (user.role === "MANAGER") {
    const hrm = await prisma.user.findFirst({
      where: { role: "HR_MANAGER", isActive: true, deletedAt: null },
    });
    return hrm?.id ?? null;
  }

  // 3️⃣ HR → HR_MANAGER approves
  if (user.role === "HR") {
    const hrm = await prisma.user.findFirst({
      where: { role: "HR_MANAGER", isActive: true, deletedAt: null },
    });
    return hrm?.id ?? null;
  }

  // 4️⃣ HR_MANAGER → Admin approves
  if (user.role === "HR_MANAGER") {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true, deletedAt: null },
    });
    return admin?.id ?? null;
  }

  // 5️⃣ ADMIN → approve own leave
  if (user.role === "ADMIN") {
    return user.id;
  }

  return null;
}
