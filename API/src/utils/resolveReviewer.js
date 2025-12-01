import prisma from "./prisma.js";

export async function resolveReviewer(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: { include: { project: true } },
    },
  });

  if (!user) return null;

  // Helper to get first active user by role
  const getUserByRole = (role) =>
    prisma.user.findFirst({
      where: { role, isActive: true, deletedAt: null },
      orderBy: { id: "asc" },
    });

  /* ======================================================
     1️⃣ EMPLOYEE → Manager → HR → HR_MANAGER → ADMIN
  ====================================================== */
  if (user.role === "EMPLOYEE") {
    // Manager check (only if in active/on_hold project)
    const activeProject = user.projects.find((p) =>
      ["ACTIVE", "ON_HOLD"].includes(p.project.status)
    );

    if (activeProject?.project?.managerId) {
      return activeProject.project.managerId;
    }

    // HR
    const hr = await getUserByRole("HR");
    if (hr) return hr.id;

    // HR_MANAGER
    const hrm = await getUserByRole("HR_MANAGER");
    if (hrm) return hrm.id;

    // ADMIN
    const admin = await getUserByRole("ADMIN");
    if (admin) return admin.id;

    return null;
  }

  /* ======================================================
     2️⃣ MANAGER → HR → HR_MANAGER → ADMIN
  ====================================================== */
  if (user.role === "MANAGER") {
    const hr = await getUserByRole("HR");
    if (hr) return hr.id;

    const hrm = await getUserByRole("HR_MANAGER");
    if (hrm) return hrm.id;

    const admin = await getUserByRole("ADMIN");
    if (admin) return admin.id;

    return null;
  }

  /* ======================================================
     3️⃣ HR → HR_MANAGER → ADMIN
  ====================================================== */
  if (user.role === "HR") {
    const hrm = await getUserByRole("HR_MANAGER");
    if (hrm) return hrm.id;

    const admin = await getUserByRole("ADMIN");
    if (admin) return admin.id;

    return null;
  }

  /* ======================================================
     4️⃣ HR_MANAGER → ADMIN
  ====================================================== */
  if (user.role === "HR_MANAGER") {
    const admin = await getUserByRole("ADMIN");
    if (admin) return admin.id;

    return null;
  }

  /* ======================================================
     5️⃣ ADMIN → SELF
  ====================================================== */
  if (user.role === "ADMIN") {
    return user.id;
  }

  return null;
}
