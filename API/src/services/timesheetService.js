import prisma from "../utils/prisma.js";
import { resolveTimesheetApprover } from "../utils/resolveTimesheetApprover.js";

function getWeekStart(dateInput) {
  const d = new Date(dateInput);

  // Normalize to local date so timezone does not push backward/forward
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);

  return date;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function findOrCreateWeek(userId, dateInput) {
  const weekStart = getWeekStart(dateInput); // normalized pure date

  let week = await prisma.timesheetWeek.findFirst({
    where: { userId, weekStartDate: weekStart },
    include: {
      entries: {
        where: { deletedAt: null },
        include: { project: true, client: true },
        orderBy: [{ project: { name: "asc" } }, { description: "asc" }],
      },
      approver: true,
    },
  });

  if (week) return week;

  try {
    week = await prisma.timesheetWeek.create({
      data: {
        userId,
        weekStartDate: weekStart,
        status: "DRAFT",
      },
      include: {
        entries: {
          where: { deletedAt: null },
          include: { project: true, client: true },
          orderBy: [{ project: { name: "asc" } }, { description: "asc" }],
        },
        approver: true,
      },
    });

    return week;
  } catch (err) {
    if (err.code === "P2002") {
      return prisma.timesheetWeek.findFirst({
        where: { userId, weekStartDate: weekStart },
        include: {
          entries: {
            where: { deletedAt: null },
            include: { project: true, client: true },
            orderBy: [{ project: { name: "asc" } }, { description: "asc" }],
          },
          approver: true,
        },
      });
    }

    throw err;
  }
}

export async function getMyTimesheetWeekService(userId, weekStartParam) {
  const date = weekStartParam ? new Date(weekStartParam) : new Date();
  let week = await findOrCreateWeek(userId, date);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: { include: { project: true } },
      projectsManaged: true,
    },
  });

  if (!user) throw new Error("User not found");
  const role = user.role;

  // ---------------------------------------------------------
  // 1) LOAD ADMIN/HR-MANAGER CREATED DEFINITIONS
  // ---------------------------------------------------------
  const defs = await prisma.timesheetDefinition.findMany({
    where: {
      deletedAt: null,
      OR: [{ appliesTo: "ALL" }, { appliesTo: role }],
    },
    include: { project: true },
  });

  // ---------------------------------------------------------
  // 2) BUILD UNIFIED ROW DEFINITIONS
  // ---------------------------------------------------------
  let rowDefs = [];

  // From definitions
  for (const d of defs) {
    if (d.type === "PROJECT") {
      if (!d.projectId) continue;

      rowDefs.push({
        key: `PROJECT-${d.projectId}`,
        type: "PROJECT",
        projectId: d.projectId,
        clientId: d.project?.clientId ?? null,
        description: null,
      });
    } else {
      if (!d.description) continue;

      rowDefs.push({
        key: `SPECIAL-${d.description}`,
        type: "SPECIAL",
        description: d.description,
        projectId: null,
        clientId: null,
      });
    }
  }

  // Role-based system rows
  if (role === "HR" || role === "HR_MANAGER") {
    rowDefs.push({
      key: "SPECIAL-HR Tasks",
      type: "SPECIAL",
      description: "HR Tasks",
    });
  }

  if (role === "ADMIN") {
    rowDefs.push({
      key: "SPECIAL-Administration",
      type: "SPECIAL",
      description: "Administration",
    });
  }

  if (role === "MANAGER" || role === "HR_MANAGER") {
    rowDefs.push(
      ...user.projectsManaged
        .filter((p) => ["ACTIVE", "ON_HOLD"].includes(p.status))
        .map((p) => ({
          key: `PROJECT-${p.id}`,
          type: "PROJECT",
          projectId: p.id,
          clientId: p.clientId,
        }))
    );
  }

  if (role === "EMPLOYEE" || role === "HR_MANAGER") {
    rowDefs.push(
      ...user.projects
        .filter((p) => ["ACTIVE", "ON_HOLD"].includes(p.project.status))
        .map((p) => ({
          key: `PROJECT-${p.projectId}`,
          type: "PROJECT",
          projectId: p.projectId,
          clientId: p.project.clientId,
        }))
    );
  }

  // Common "system" rows
  rowDefs.push({
    key: "SPECIAL-HR_ACTIVITIES",
    type: "SPECIAL",
    description: "HR_ACTIVITIES",
  });

  rowDefs.push({
    key: "BENCH",
    type: "BENCH",
    description: "Bench",
  });

  // Deduplicate definitions
  rowDefs = rowDefs.filter(
    (r, i, arr) => i === arr.findIndex((x) => x.key === r.key)
  );

  // ---------------------------------------------------------
  // 3) LOAD EXISTING WEEK ENTRIES
  // ---------------------------------------------------------
  let existing = week.entries ?? [];

  // ---------------------------------------------------------
  // Helper to compute unique key from entry
  // ---------------------------------------------------------
  function entryKey(e) {
    if (e.projectId) return `PROJECT-${e.projectId}`;
    if (e.description === "Bench") return "BENCH";
    if (e.description) return `SPECIAL-${e.description}`;
    return null;
  }

  // ---------------------------------------------------------
  // 4) CONVERT INVALID PROJECT ROWS → BENCH
  // ---------------------------------------------------------
  const validProjectIds = rowDefs
    .filter((r) => r.type === "PROJECT")
    .map((r) => r.projectId);

  const convertOps = [];

  for (const e of existing) {
    if (e.projectId && !validProjectIds.includes(e.projectId)) {
      convertOps.push(
        prisma.timesheetEntry.update({
          where: { id: e.id },
          data: {
            projectId: null,
            clientId: null,
            description: "Bench",
            isBillable: false,
          },
        })
      );
    }
  }

  if (convertOps.length) await Promise.all(convertOps);

  // Reload existing
  week = await prisma.timesheetWeek.findUnique({
    where: { id: week.id },
    include: {
      entries: {
        where: { deletedAt: null },
        include: { project: true, client: true },
        orderBy: { id: "asc" },
      },
      approver: true,
    },
  });
  existing = week.entries ?? [];

  // ---------------------------------------------------------
  // 5) REMOVE SPECIAL ROWS THAT ARE NOT IN DEFINITIONS
  // ---------------------------------------------------------
  const validSpecialKeys = rowDefs
    .filter((r) => r.type === "SPECIAL")
    .map((r) => r.key);

  const removeOps = [];

  for (const e of existing) {
    const key = entryKey(e);

    if (
      key?.startsWith("SPECIAL-") &&
      !validSpecialKeys.includes(key) // removed definition
    ) {
      removeOps.push(
        prisma.timesheetEntry.update({
          where: { id: e.id },
          data: { deletedAt: new Date() },
        })
      );
    }
  }

  if (removeOps.length) await Promise.all(removeOps);

  // Reload after removing invalid special rows
  week = await prisma.timesheetWeek.findUnique({
    where: { id: week.id },
    include: {
      entries: { where: { deletedAt: null }, include: { project: true } },
    },
  });
  existing = week.entries ?? [];

  // ---------------------------------------------------------
  // 6) REMOVE DUPLICATES
  // ---------------------------------------------------------
  const seen = new Set();
  const dupOps = [];

  for (const e of existing) {
    const key = entryKey(e);

    if (!key) continue;

    if (seen.has(key)) {
      dupOps.push(
        prisma.timesheetEntry.update({
          where: { id: e.id },
          data: { deletedAt: new Date() },
        })
      );
    } else {
      seen.add(key);
    }
  }

  if (dupOps.length) await Promise.all(dupOps);

  // Reload after dedupe
  week = await prisma.timesheetWeek.findUnique({
    where: { id: week.id },
    include: {
      entries: { where: { deletedAt: null }, include: { project: true } },
    },
  });

  existing = week.entries ?? [];

  // ---------------------------------------------------------
  // 7) CREATE MISSING ROWS
  // ---------------------------------------------------------
  const createOps = [];

  for (const def of rowDefs) {
    const hasRow = existing.some((e) => entryKey(e) === def.key);

    if (!hasRow) {
      createOps.push(
        prisma.timesheetEntry.create({
          data: {
            timesheetId: week.id,
            projectId: def.projectId ?? null,
            clientId: def.clientId ?? null,
            description:
              def.type === "SPECIAL"
                ? def.description
                : def.type === "BENCH"
                ? "Bench"
                : null,
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            sat: 0,
            sun: 0,
            isBillable: def.type === "PROJECT",
          },
        })
      );
    }
  }

  if (createOps.length) await Promise.all(createOps);

  // ---------------------------------------------------------
  // FINAL RETURN
  // ---------------------------------------------------------
  return prisma.timesheetWeek.findUnique({
    where: { id: week.id },
    include: {
      entries: {
        where: { deletedAt: null },
        include: { project: true, client: true },
        orderBy: [
          {
            project: {
              name: "asc", // 🔥 Sort by project.name
            },
          },
          { description: "asc" }, // sorts SPECIAL rows alphabetically
          { id: "asc" }, // stable fallback order
        ],
      },
      approver: true,
    },
  });
}

export async function saveSingleEntryService(userId, data) {
  const {
    id,
    weekStart,
    projectId,
    clientId,
    mon,
    tue,
    wed,
    thu,
    fri,
    sat,
    sun,
    isBillable,
    description,
  } = data;

  const week = await findOrCreateWeek(userId, weekStart);

  if (week.status !== "DRAFT") throw new Error("Cannot edit submitted week");

  // UPDATE
  if (id) {
    return prisma.timesheetEntry.update({
      where: { id },
      data: {
        projectId,
        clientId,
        mon,
        tue,
        wed,
        thu,
        fri,
        sat,
        sun,
        isBillable,
        description,
      },
    });
  }

  // CREATE
  return prisma.timesheetEntry.create({
    data: {
      timesheetId: week.id,
      projectId,
      clientId,
      mon,
      tue,
      wed,
      thu,
      fri,
      sat,
      sun,
      isBillable,
      description,
    },
  });
}

export async function saveTimesheetWeekService(userId, weekId, entries) {
  if (!Array.isArray(entries)) throw new Error("Invalid timesheet payload");

  const week = await prisma.timesheetWeek.findUnique({ where: { id: weekId } });

  if (!week) throw new Error("Timesheet not found");
  if (week.userId !== userId) throw new Error("Not your timesheet");
  if (week.status !== "DRAFT") throw new Error("Cannot edit submitted week");

  return prisma.$transaction(async (tx) => {
    for (const e of entries) {
      await tx.timesheetEntry.upsert({
        where: { id: e.id ?? 0 },
        update: {
          projectId: e.projectId,
          clientId: e.clientId,
          mon: e.mon,
          tue: e.tue,
          wed: e.wed,
          thu: e.thu,
          fri: e.fri,
          sat: e.sat,
          sun: e.sun,
          isBillable: e.isBillable,
          description: e.description,
        },
        create: {
          timesheetId: weekId,
          projectId: e.projectId,
          clientId: e.clientId,
          mon: e.mon,
          tue: e.tue,
          wed: e.wed,
          thu: e.thu,
          fri: e.fri,
          sat: e.sat,
          sun: e.sun,
          isBillable: e.isBillable,
          description: e.description,
        },
      });
    }

    return true;
  });
}

export async function submitTimesheetWeekService(
  userId,
  weekId,
  uiEntries = []
) {
  // 0) Load week
  const week = await prisma.timesheetWeek.findUnique({
    where: { id: weekId },
  });

  if (!week) throw new Error("Timesheet not found");
  if (week.userId !== userId) throw new Error("Not your timesheet");
  if (week.status !== "DRAFT") throw new Error("Already submitted");

  // 1) If UI did NOT send entries, fallback to DB entries
  let entriesToSave = uiEntries.length
    ? uiEntries // ⬅ use latest user-entered values
    : await prisma.timesheetEntry.findMany({
        where: { timesheetId: weekId, deletedAt: null },
      });

  // 2) AUTO-SAVE the latest values
  await prisma.$transaction(async (tx) => {
    for (const e of entriesToSave) {
      await tx.timesheetEntry.update({
        where: { id: e.id },
        data: {
          mon: e.mon ?? 0,
          tue: e.tue ?? 0,
          wed: e.wed ?? 0,
          thu: e.thu ?? 0,
          fri: e.fri ?? 0,
          sat: e.sat ?? 0,
          sun: e.sun ?? 0,
          isBillable: e.isBillable ?? false,
          description: e.description ?? null,
        },
      });
    }
  });

  // 3) Reload CLEAN DB entries
  const entries = await prisma.timesheetEntry.findMany({
    where: { timesheetId: weekId, deletedAt: null },
  });

  if (!entries.length) throw new Error("Cannot submit empty timesheet");

  // 4) Exclude BENCH rows
  const working = entries.filter((e) => e.description !== "Bench");

  const totalHours = working.reduce(
    (sum, e) =>
      sum +
      (e.mon || 0) +
      (e.tue || 0) +
      (e.wed || 0) +
      (e.thu || 0) +
      (e.fri || 0) +
      (e.sat || 0) +
      (e.sun || 0),
    0
  );

  // 5) Leave calculation
  const weekStart = new Date(week.weekStartDate);
  const weekEnd = addDays(weekStart, 7);

  const leaves = await prisma.leave.findMany({
    where: {
      userId,
      status: "APPROVED",
      deletedAt: null,
      AND: [{ startDate: { lt: weekEnd } }, { endDate: { gte: weekStart } }],
    },
  });

  let leaveDays = 0;
  for (const leave of leaves) {
    const ls = new Date(leave.startDate);
    const le = new Date(leave.endDate);

    const overlapStart = ls > weekStart ? ls : weekStart;
    const overlapEnd = le < addDays(weekEnd, -1) ? le : addDays(weekEnd, -1);

    let d = new Date(overlapStart);
    while (d <= overlapEnd) {
      if (d.getDay() >= 1 && d.getDay() <= 5) leaveDays++;
      d.setDate(d.getDate() + 1);
    }
  }

  const requiredHours = Math.max(0, 40 - leaveDays * 8);

  if (totalHours < requiredHours) {
    throw new Error(
      `You must complete at least ${requiredHours} hours this week (leave days excluded)`
    );
  }

  // 6) Submit week
  const approverId = await resolveTimesheetApprover(userId);

  return prisma.timesheetWeek.update({
    where: { id: weekId },
    data: {
      status: "SUBMITTED",
      approverId,
      submittedAt: new Date(),
    },
    include: { approver: true },
  });
}

export async function createTimesheetDefinition(req, res) {
  const { name, appliesTo } = req.body;

  if (!["ALL", "EMPLOYEE", "HR", "MANAGER"].includes(appliesTo)) {
    return res.status(400).json({ message: "Invalid appliesTo" });
  }

  const role = req.user.role;

  if (role !== "ADMIN" && role !== "HR_MANAGER") {
    return res.status(403).json({ message: "Not allowed" });
  }

  const def = await prisma.timesheetDefinition.create({
    data: {
      name,
      appliesTo,
      createdById: req.user.id,
    },
  });

  return res.json(def);
}

export async function createDefinitionService(data) {
  const { type, projectId, description, appliesTo } = data;

  if (type === "PROJECT" && !projectId) {
    throw new Error("projectId required for PROJECT type");
  }

  if (type !== "PROJECT" && !description) {
    throw new Error("description required for non-project type");
  }

  return prisma.timesheetDefinition.create({
    data: {
      type,
      projectId: projectId ?? null,
      description: description ?? null,
      appliesTo,
    },
  });
}

export async function listDefinitionsService() {
  return prisma.timesheetDefinition.findMany({
    where: { deletedAt: null },
    orderBy: { id: "asc" },
    include: { project: true },
  });
}

export async function updateDefinitionService(id, data) {
  const { type, projectId, description, appliesTo } = data;

  return prisma.timesheetDefinition.update({
    where: { id },
    data: {
      type,
      appliesTo,
      projectId: type === "PROJECT" ? projectId : null,
      description: type === "SPECIAL" ? description : null,
    },
  });
}

export async function deleteDefinitionService(id) {
  return prisma.timesheetDefinition.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
