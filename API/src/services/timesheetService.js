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
  const weekStart = getWeekStart(dateInput);

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

function normalizeDesc(desc) {
  return desc ? desc.trim().toUpperCase() : null;
}

function buildRowKey(def) {
  if (def.type === "PROJECT") {
    if (!def.projectId) {
      throw new Error("PROJECT row without projectId");
    }
    return `PROJECT-${def.projectId}`;
  }

  if (!def.description) {
    throw new Error("SPECIAL row without description");
  }

  return `SPECIAL-${normalizeDesc(def.description)}`;
}

function getMonday(d) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = local.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + diff);
  return local;
}

function isCurrentOrFutureWeek(weekStart) {
  const now = new Date();
  const currentMonday = getMonday(now);
  return weekStart >= currentMonday;
}

export async function getMyTimesheetWeekService(userId, weekStartParam) {
  const date = weekStartParam ? new Date(weekStartParam) : new Date();

  const week = await findOrCreateWeek(userId, date);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: {
        where: { project: { deletedAt: null } },
        include: { project: true },
      },
      projectsManaged: {
        where: { deletedAt: null },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const role = user.role;

  const weekStart = new Date(week.weekStartDate);
  const isDraft = week.status === "DRAFT";
  const isCurrentOrFuture = isCurrentOrFutureWeek(weekStart);

  // Get all definitions applicable by role (INCLUDING deleted)
  const allDefs = await prisma.timesheetDefinition.findMany({
    where: {
      appliesTo: { in: ["ALL", role] },
    },
  });

  // Get rowKeys already present in this timesheet
  const existingEntries = await prisma.timesheetEntry.findMany({
    where: {
      timesheetId: week.id,
      deletedAt: null,
    },
    select: { rowKey: true },
  });

  const existingRowKeys = new Set(existingEntries.map((e) => e.rowKey));

  // Final visible definitions
  const defs = allDefs.filter((def) => {
    // Always show active definitions
    if (!def.deletedAt) return true;

    // If timesheet is submitted → freeze snapshot
    if (!isDraft) return true;

    // If previous week → keep history
    if (!isCurrentOrFuture) return true;

    // Draft + current/future → only if already used
    const rowKey =
      def.type === "PROJECT"
        ? `PROJECT-${def.projectId}`
        : `SPECIAL-${normalizeDesc(def.description)}`;

    return existingRowKeys.has(rowKey);
  });

  const rowDefs = [];

  /* ---------------- SPECIAL DEFINITIONS (DEDUPED) ---------------- */

  const seenSpecial = new Set();

  for (const d of defs) {
    if (d.type !== "SPECIAL" || !d.description) continue;

    const desc = normalizeDesc(d.description);
    if (seenSpecial.has(desc)) continue;

    seenSpecial.add(desc);

    rowDefs.push({
      type: "SPECIAL",
      description: desc,
    });
  }

  /* ---------------- PROJECT ROWS (ROLE-BASED) ---------------- */

  // ADMIN / HR → PROJECT definitions
  if (role === "ADMIN" || role === "HR") {
    for (const d of defs) {
      if (d.type === "PROJECT" && d.projectId) {
        rowDefs.push({
          type: "PROJECT",
          projectId: d.projectId,
          clientId: d.project?.clientId ?? null,
          description: null,
        });
      }
    }
  }

  // MANAGER / HR_MANAGER → managed projects
  if (role === "MANAGER" || role === "HR_MANAGER") {
    for (const p of user.projectsManaged) {
      if (!p?.id) continue;

      rowDefs.push({
        type: "PROJECT",
        projectId: p.id,
        clientId: p.clientId ?? null,
        description: null,
      });
    }
  }

  // EMPLOYEE → assigned projects
  if (role === "EMPLOYEE") {
    for (const p of user.projects) {
      if (!p?.project || !p.projectId) continue;

      rowDefs.push({
        type: "PROJECT",
        projectId: p.projectId,
        clientId: p.project.clientId ?? null,
        description: null,
      });
    }
  }

  /* ---------------- DEDUPE BY ROWKEY ---------------- */

  const uniqueDefs = Array.from(
    new Map(
      rowDefs
        .filter(
          (d) =>
            d &&
            (d.type === "PROJECT"
              ? Number.isInteger(d.projectId)
              : typeof d.description === "string")
        )
        .map((d) => {
          const key = buildRowKey(d);
          return [key, { ...d, rowKey: key }];
        })
    ).values()
  );

  /* ---------------- UPSERT SAFELY ---------------- */

  await prisma.$transaction(
    uniqueDefs.map((def) =>
      prisma.timesheetEntry.upsert({
        where: {
          timesheet_rowkey_unique: {
            timesheetId: week.id,
            rowKey: def.rowKey,
          },
        },
        update: {},
        create: {
          timesheetId: week.id,
          rowKey: def.rowKey,
          projectId: def.projectId ?? null,
          clientId: def.clientId ?? null,
          description: def.type === "PROJECT" ? null : def.description,
          isBillable: def.type === "PROJECT",
          mon: 0,
          tue: 0,
          wed: 0,
          thu: 0,
          fri: 0,
          sat: 0,
          sun: 0,
        },
      })
    )
  );

  return prisma.timesheetWeek.findUnique({
    where: { id: week.id },
    include: {
      entries: {
        where: { deletedAt: null },
        include: { project: true, client: true },
        orderBy: [
          { project: { name: "asc" } },
          { description: "asc" },
          { id: "asc" },
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
  if (week.status !== "DRAFT") throw new Error("Cannot save submitted week");

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
// ----------------------------------------- TIMESHEET DEFINITION -----------------------------------------

export async function createTimesheetDefinition(req, res) {
  const { name, appliesTo } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Name is required" });
  }

  if (!["ALL", "EMPLOYEE", "HR", "MANAGER"].includes(appliesTo)) {
    return res.status(400).json({ message: "Invalid appliesTo" });
  }

  const role = req.user.role;
  if (role !== "ADMIN" && role !== "HR_MANAGER") {
    return res.status(403).json({ message: "Not allowed" });
  }

  const normalizedName = name.trim().toUpperCase();
  const SYSTEM_NAMES = ["BENCH", "HR_ACTIVITIES"];

  if (SYSTEM_NAMES.includes(normalizedName)) {
    return res.status(403).json({
      message: "System definitions cannot be created manually",
    });
  }

  // 🔍 Find existing (including soft-deleted)
  const existing = await prisma.timesheetDefinition.findFirst({
    where: {
      type: "SPECIAL",
      description: normalizedName,
      appliesTo,
    },
  });

  // ✅ Exists & active → error
  if (existing && !existing.deletedAt) {
    return res.status(409).json({
      message: "Definition name already exists",
    });
  }

  // ♻️ Exists but soft-deleted → restore
  if (existing && existing.deletedAt) {
    const restored = await prisma.timesheetDefinition.update({
      where: { id: existing.id },
      data: { deletedAt: null },
    });

    return res.json(restored);
  }

  // ➕ Fresh create
  const def = await prisma.timesheetDefinition.create({
    data: {
      type: "SPECIAL",
      description: normalizedName,
      appliesTo,
      createdById: req.user.id,
    },
  });

  return res.json(def);
}

export async function createDefinitionService(data) {
  const { type, projectId, description, appliesTo, createdById } = data;

  if (!["ALL", "EMPLOYEE", "HR", "MANAGER"].includes(appliesTo)) {
    throw new Error("Invalid appliesTo");
  }

  if (type === "PROJECT") {
    if (!projectId) {
      throw new Error("projectId required for PROJECT type");
    }
  } else {
    if (!description) {
      throw new Error("description required for non-project type");
    }
  }

  const normalizedDesc = type === "PROJECT" ? null : normalizeDesc(description);

  // 🚫 Block system definitions
  // const SYSTEM_NAMES = ["BENCH", "HR_ACTIVITIES"];
  // if (normalizedDesc && SYSTEM_NAMES.includes(normalizedDesc)) {
  //   throw new Error("System definitions cannot be created manually");
  // }

  // 🔍 Find existing (including soft-deleted)
  const existing = await prisma.timesheetDefinition.findFirst({
    where: {
      type,
      description: normalizedDesc,
      appliesTo,
    },
  });

  // ✅ Exists & active → error
  if (existing && !existing.deletedAt) {
    throw new Error("Definition name already exists");
  }

  // ♻️ Exists but soft-deleted → restore
  if (existing && existing.deletedAt) {
    return prisma.timesheetDefinition.update({
      where: { id: existing.id },
      data: {
        deletedAt: null,
        projectId: type === "PROJECT" ? projectId : null,
      },
    });
  }

  // ➕ Fresh create
  return prisma.timesheetDefinition.create({
    data: {
      type,
      projectId: type === "PROJECT" ? projectId : null,
      description: normalizedDesc,
      appliesTo,
      createdById,
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
