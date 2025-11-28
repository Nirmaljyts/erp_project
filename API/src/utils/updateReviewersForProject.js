import prisma from "./prisma.js";
import { resolveReviewer } from "./resolveReviewer.js";

export async function updateReviewersForProject(projectId) {
  const employees = await prisma.projectEmployee.findMany({
    where: { projectId: projectId },
    select: { employeeId: true },
  });

  for (const emp of employees) {
    const reviewer = await resolveReviewer(emp.employeeId);

    await prisma.leave.updateMany({
      where: {
        userId: emp.employeeId,
        status: "PENDING",
        deletedAt: null,
      },
      data: { reviewerId: reviewer },
    });
  }
}
