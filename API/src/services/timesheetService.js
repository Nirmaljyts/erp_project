import prisma from "../utils/prisma.js";
import { resolveTimesheetApprover } from "../utils/resolveTimesheetApprover.js";
import {
  notifyTimesheetApproved,
  notifyTimesheetRejected,
  notifyTimesheetSubmitted,
} from "./timesheetNotificationService.js";

// ----------------------------------------- TIMESHEET -----------------------------------------

export function getWeekStart(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d)) throw new Error("Invalid date");

  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate()
  ));

  weekStart.setUTCDate(weekStart.getUTCDate() + diff);

  return weekStart; // ALWAYS 00:00:00.000Z
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function findOrCreateWeek(userId, dateInput) {
  const weekStart = getWeekStart(dateInput);

  // Create range for safe matching (avoids timezone mismatch)
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 1);

  // 1. Try find existing
  let week = await prisma.timesheetWeek.findFirst({
    where: {
      userId,
      weekStartDate: {
        gte: start,
        lt: end,
      },
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

  if (week) return week;

  // 2. Try create
  try {
    return await prisma.timesheetWeek.create({
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
  } catch (err) {
    // 3. Handle race condition safely
    if (err?.code === "P2002") {
      const existing = await prisma.timesheetWeek.findFirst({
        where: {
          userId,
          weekStartDate: {
            gte: start,
            lt: end,
          },
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

      if (!existing) {
        throw new Error(
          "Race condition detected but week not found — check DB consistency",
        );
      }

      return existing;
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

function toDayKey(d) {
  const day = d.getDay();
  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  if (day === 6) return "sat";
  return "sun";
}

async function getApprovedLeaveMapForWeek(userId, weekStartDate) {
  // Normalize week start to LOCAL date (prevents timezone drift)
  const ws = new Date(weekStartDate);
  const weekStart = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate());
  const weekEndExclusive = addDays(weekStart, 7); // [start, end)

  const leaves = await prisma.leave.findMany({
    where: {
      userId,
      status: "APPROVED",
      deletedAt: null,
      AND: [
        { startDate: { lt: weekEndExclusive } },
        { endDate: { gte: weekStart } },
      ],
    },
  });

  const leaveMap = {
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  };

  for (const leave of leaves) {
    const ls = new Date(leave.startDate);
    const le = new Date(leave.endDate);

    const overlapStart = ls > weekStart ? ls : weekStart;
    const overlapEnd =
      le < addDays(weekEndExclusive, -1) ? le : addDays(weekEndExclusive, -1);

    let d = new Date(overlapStart);
    while (d <= overlapEnd) {
      const day = d.getDay();

      // Only mark working days (Mon–Fri)
      if (day >= 1 && day <= 5) {
        leaveMap[toDayKey(d)] = true;
      }

      d.setDate(d.getDate() + 1);
    }
  }

  return {
    leaveMap,
    leaves,
  };
}

function isUniqueConstraintError(err) {
  return (
    err?.code === "P2002" || err?.message?.includes("Unique constraint failed")
  );
}

export async function getMyTimesheetWeekService(userId, weekStartParam) {
  const date = weekStartParam ? new Date(weekStartParam) : new Date();

  // Find or create week (should be the ONLY place week creation happens)
  const week = await findOrCreateWeek(userId, date);
  if (!week) {
    throw new Error("Failed to load or create timesheet week");
  }

  // Load user with relations
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

  /* ---------------- LOAD DEFINITIONS ---------------- */

  const allDefs = await prisma.timesheetDefinition.findMany({
    where: {
      appliesTo: { in: ["ALL", role] },
    },
    include: { project: true },
  });

  const existingEntries = await prisma.timesheetEntry.findMany({
    where: {
      timesheetId: week.id,
      deletedAt: null,
    },
    select: {
      rowKey: true,
    },
  });

  const existingRowKeys = new Set(existingEntries.map((e) => e.rowKey));

  /* ---------------- FILTER DEFINITIONS ---------------- */

  const defs = allDefs.filter((def) => {
    if (!def.deletedAt) return true;
    if (!isDraft) return true;
    if (!isCurrentOrFuture) return true;

    const rowKey =
      def.type === "PROJECT"
        ? `PROJECT-${def.projectId}`
        : `SPECIAL-${normalizeDesc(def.description)}`;

    return existingRowKeys.has(rowKey);
  });

  /* ---------------- BUILD ROW DEFINITIONS ---------------- */

  const rowDefs = [];
  const seenSpecial = new Set();

  // SPECIAL rows (deduped)
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

  // PROJECT rows by role
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
        .filter((d) =>
          d.type === "PROJECT"
            ? Number.isInteger(d.projectId)
            : typeof d.description === "string",
        )
        .map((d) => {
          const rowKey = buildRowKey(d);
          return [rowKey, { ...d, rowKey }];
        }),
    ).values(),
  );

  /* ---------------- SAFE UPSERT (NO DEADLOCKS) ---------------- */

  // Only write if something is missing
  const missingDefs = uniqueDefs.filter((d) => !existingRowKeys.has(d.rowKey));

  if (missingDefs.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const def of missingDefs) {
          await tx.timesheetEntry.upsert({
            where: {
              timesheet_rowkey_unique: {
                timesheetId: week.id,
                rowKey: def.rowKey,
              },
            },
            update: {
              projectId: def.projectId ?? null,
              clientId: def.clientId ?? null,
              description: def.type === "PROJECT" ? null : def.description,
              isBillable: def.type === "PROJECT",
            },
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
          });
        }
      });
    } catch (err) {
      // SAFE TO IGNORE — another request created the rows
      if (!isUniqueConstraintError(err)) {
        throw err;
      }
    }
  }

  /* ---------------- LEAVES ---------------- */

  const { leaveMap, leaves } = await getApprovedLeaveMapForWeek(
    userId,
    weekStart,
  );

  /* ---------------- FINAL FETCH ---------------- */

  const result = await prisma.timesheetWeek.findUnique({
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

  return {
    ...result,
    leaveMap,
    leaves,
  };
}

function assertNoHoursOnLeaveDays(entry, leaveMap) {
  const map = [
    ["mon", entry.mon],
    ["tue", entry.tue],
    ["wed", entry.wed],
    ["thu", entry.thu],
    ["fri", entry.fri],
    ["sat", entry.sat],
    ["sun", entry.sun],
  ];

  for (const [day, val] of map) {
    if (leaveMap[day] && (val || 0) > 0) {
      throw new Error(
        `Cannot log hours on ${day.toUpperCase()} (approved leave)`,
      );
    }
  }
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

  if (week.status !== "DRAFT") {
    throw new Error("Cannot edit submitted week");
  }

  const leaveMap = await getApprovedLeaveMapForWeek(userId, week.weekStartDate);

  assertNoHoursOnLeaveDays({ mon, tue, wed, thu, fri, sat, sun }, leaveMap);

  // -------- UPDATE --------
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

  // -------- CREATE --------
  const rowKey = projectId
    ? `PROJECT-${projectId}`
    : `SPECIAL-${normalizeDesc(description)}`;

  return prisma.timesheetEntry.create({
    data: {
      timesheetId: week.id,
      rowKey,
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
  if (!Array.isArray(entries)) {
    throw new Error("Invalid timesheet payload");
  }

  const week = await prisma.timesheetWeek.findUnique({
    where: { id: weekId },
  });

  if (!week) throw new Error("Timesheet not found");
  if (week.userId !== userId) throw new Error("Not your timesheet");
  if (week.status !== "DRAFT") throw new Error("Cannot save submitted week");

  const leaveMap = await getApprovedLeaveMapForWeek(userId, week.weekStartDate);

  return prisma.$transaction(async (tx) => {
    for (const e of entries) {
      assertNoHoursOnLeaveDays(e, leaveMap);

      // -------- UPDATE --------
      if (e.id) {
        await tx.timesheetEntry.update({
          where: { id: e.id },
          data: {
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
        continue;
      }

      // -------- CREATE --------
      const rowKey = e.projectId
        ? `PROJECT-${e.projectId}`
        : `SPECIAL-${normalizeDesc(e.description)}`;

      await tx.timesheetEntry.create({
        data: {
          timesheetId: weekId,
          rowKey,
          projectId: e.projectId ?? null,
          clientId: e.clientId ?? null,
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
  uiEntries = [],
) {
  const week = await prisma.timesheetWeek.findUnique({
    where: { id: weekId },
  });

  if (!week) throw new Error("Timesheet not found");
  if (week.userId !== userId) throw new Error("Not your timesheet");
  if (week.status !== "DRAFT") throw new Error("Already submitted");

  // Use UI entries if provided
  let entriesToSave = uiEntries.length
    ? uiEntries
    : await prisma.timesheetEntry.findMany({
        where: { timesheetId: weekId, deletedAt: null },
      });

  const leaveMap = await getApprovedLeaveMapForWeek(userId, week.weekStartDate);

  // Auto-save + validate
  await prisma.$transaction(async (tx) => {
    for (const e of entriesToSave) {
      assertNoHoursOnLeaveDays(e, leaveMap);

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

  const entries = await prisma.timesheetEntry.findMany({
    where: { timesheetId: weekId, deletedAt: null },
  });

  if (!entries.length) {
    throw new Error("Cannot submit empty timesheet");
  }

  // Exclude BENCH rows
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
    0,
  );

  // Leave-based required hours (UNCHANGED logic)
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
    let d = new Date(Math.max(new Date(leave.startDate), weekStart));
    const end = new Date(
      Math.min(new Date(leave.endDate), addDays(weekEnd, -1)),
    );

    while (d <= end) {
      if (d.getDay() >= 1 && d.getDay() <= 5) leaveDays++;
      d.setDate(d.getDate() + 1);
    }
  }

  const requiredHours = Math.max(0, 40 - leaveDays * 8);

  if (totalHours < requiredHours) {
    throw new Error(
      `You must complete at least ${requiredHours} hours this week (leave days excluded)`,
    );
  }

  const approverId = await resolveTimesheetApprover(userId);

  const updatedWeek = await prisma.timesheetWeek.update({
    where: { id: weekId },
    data: {
      status: "SUBMITTED",
      approverId,
      submittedAt: new Date(),
    },
    include: {
      approver: true,
      user: { select: { name: true } },
    },
  });

  // NOTIFY APPROVER (avoided self-notify)
  if (approverId && approverId !== userId) {
    await notifyTimesheetSubmitted({
      approverId,
      employeeName: updatedWeek.user.name,
      ts: updatedWeek,
    });
  }

  return updatedWeek;
}

// ----------------------------------------- TIMESHEET APPROVAL -----------------------------------------

/* ---------------- LIST TIMESHEET APPROVALS ---------------- */

export async function getTimesheetApprovalsService(currentUser) {
  const { id: approverId, role } = currentUser;

  // Base query (submitted only)
  const weeks = await prisma.timesheetWeek.findMany({
    where: {
      status: "SUBMITTED",
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          projects: {
            include: { project: true },
          },
        },
      },
      entries: {
        where: { deletedAt: null },
      },
    },
    orderBy: { weekStartDate: "desc" },
  });

  const result = [];

  for (const w of weeks) {
    const owner = w.user;

    let allowed = false;

    /* ---------------- ADMIN ---------------- */
    if (role === "ADMIN") {
      allowed = owner.role === "ADMIN";
    }

    /* ---------------- HR_MANAGER ---------------- */
    if (role === "HR_MANAGER") {
      allowed = ["HR", "MANAGER", "EMPLOYEE"].includes(owner.role);
    }

    /* ---------------- MANAGER ---------------- */
    if (role === "MANAGER" && owner.role === "EMPLOYEE") {
      // manager must manage at least one project the employee is assigned to
      const managerProjects = await prisma.project.findMany({
        where: {
          managerId: approverId,
          deletedAt: null,
          employees: {
            some: {
              employeeId: owner.id,
            },
          },
        },
        select: { id: true },
      });

      allowed = managerProjects.length > 0;
    }

    if (!allowed) continue;

    // Attach leaveMap
    const { leaveMap } = await getApprovedLeaveMapForWeek(
      owner.id,
      w.weekStartDate,
    );

    result.push({
      ...w,
      leaveMap,
    });
  }

  return result;
}

/* ---------------- APPROVE TIMESHEET ---------------- */

export async function approveTimesheetService(userId, weekId) {
  const week = await prisma.timesheetWeek.findUnique({
    where: { id: weekId },
  });

  if (!week) throw new Error("Timesheet not found");
  if (week.status !== "SUBMITTED") {
    throw new Error("Only submitted timesheets can be approved");
  }

  // Optional but recommended: prevent self-approval
  // if (week.userId === userId) {
  //   throw new Error("You cannot approve your own timesheet");
  // }

  const updated = await prisma.timesheetWeek.update({
    where: { id: weekId },
    data: {
      status: "APPROVED",
      approverId: userId,
      decidedAt: new Date(),
    },
  });

  // Notify
  // if (week.userId !== userId) {
  await notifyTimesheetApproved({
    employeeId: week.userId,
    timesheetId: week.id,
  });
  // }

  return updated;
}

/* ---------------- REJECT TIMESHEET ---------------- */

export async function rejectTimesheetService(userId, weekId) {
  const week = await prisma.timesheetWeek.findUnique({
    where: { id: weekId },
  });

  if (!week) throw new Error("Timesheet not found");
  if (week.status !== "SUBMITTED") {
    throw new Error("Only submitted timesheets can be rejected");
  }

  // Optional but recommended: prevent self-rejection
  // if (week.userId === userId) {
  //   throw new Error("You cannot reject your own timesheet");
  // }

  const updated = await prisma.timesheetWeek.update({
    where: { id: weekId },
    data: {
      status: "DRAFT",
      approverId: userId,
      decidedAt: new Date(),
    },
  });

  // Notify
  // if (week.userId !== userId) {
  await notifyTimesheetRejected({
    employeeId: week.userId,
    timesheetId: week.id,
  });
  // }

  return updated;
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

  // if (SYSTEM_NAMES.includes(normalizedName)) {
  //   return res.status(403).json({
  //     message: "System definitions cannot be created manually",
  //   });
  // }

  // Find existing (including soft-deleted)
  const existing = await prisma.timesheetDefinition.findFirst({
    where: {
      type: "SPECIAL",
      description: normalizedName,
      appliesTo,
    },
  });

  // Exists & active → error
  if (existing && !existing.deletedAt) {
    return res.status(409).json({
      message: "Definition name already exists",
    });
  }

  // Exists but soft-deleted → restore
  if (existing && existing.deletedAt) {
    const restored = await prisma.timesheetDefinition.update({
      where: { id: existing.id },
      data: { deletedAt: null },
    });

    return res.json(restored);
  }

  // Fresh create
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

  if (!["PROJECT", "SPECIAL"].includes(type)) {
    throw new Error("Invalid type");
  }

  // -------------------------
  // PROJECT
  // -------------------------
  if (type === "PROJECT") {
    if (!projectId) {
      throw new Error("projectId required for PROJECT type");
    }

    // Check existing (by projectId only)
    const existing = await prisma.timesheetDefinition.findFirst({
      where: {
        type: "PROJECT",
        projectId,
      },
    });

    if (existing && !existing.deletedAt) {
      throw new Error("Project definition already exists");
    }

    if (existing && existing.deletedAt) {
      return prisma.timesheetDefinition.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          appliesTo: null,
        },
      });
    }

    return prisma.timesheetDefinition.create({
      data: {
        type: "PROJECT",
        projectId,
        description: null,
        appliesTo: null,
        createdById,
      },
    });
  }

  // -------------------------
  // SPECIAL
  // -------------------------
  if (!description) {
    throw new Error("description required for SPECIAL type");
  }

  if (!["ALL", "EMPLOYEE", "HR", "MANAGER"].includes(appliesTo)) {
    throw new Error("Invalid appliesTo");
  }

  const normalizedDesc = normalizeDesc(description);

  const SYSTEM_NAMES = ["BENCH", "HR_ACTIVITIES"];
  // if (SYSTEM_NAMES.includes(normalizedDesc)) {
  //   throw new Error("System definitions cannot be created manually");
  // }

  const existing = await prisma.timesheetDefinition.findFirst({
    where: {
      type: "SPECIAL",
      description: normalizedDesc,
      appliesTo,
    },
  });

  if (existing && !existing.deletedAt) {
    throw new Error("Definition already exists");
  }

  if (existing && existing.deletedAt) {
    return prisma.timesheetDefinition.update({
      where: { id: existing.id },
      data: { deletedAt: null },
    });
  }

  return prisma.timesheetDefinition.create({
    data: {
      type: "SPECIAL",
      projectId: null,
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

  if (!["PROJECT", "SPECIAL"].includes(type)) {
    throw new Error("Invalid type");
  }

  if (type === "PROJECT") {
    if (!projectId) {
      throw new Error("projectId required for PROJECT type");
    }

    return prisma.timesheetDefinition.update({
      where: { id },
      data: {
        type: "PROJECT",
        projectId,
        description: null,
        appliesTo: null,
      },
    });
  }

  // SPECIAL
  if (!description) {
    throw new Error("description required for SPECIAL type");
  }

  if (!["ALL", "EMPLOYEE", "HR", "MANAGER"].includes(appliesTo)) {
    throw new Error("Invalid appliesTo");
  }

  return prisma.timesheetDefinition.update({
    where: { id },
    data: {
      type: "SPECIAL",
      projectId: null,
      description: normalizeDesc(description),
      appliesTo,
    },
  });
}

export async function deleteDefinitionService(id) {
  return prisma.timesheetDefinition.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ----------------------------------------- TIMESHEET REPORT -----------------------------------------

export async function getTimesheetReportService(params, currentUser) {
  const { userId, projectId, clientId, from, to } = params;

  const whereWeek = {
    deletedAt: null,
    status: "APPROVED",
    ...(userId && { userId: Number(userId) }),
    ...(from && { weekStartDate: { gte: new Date(from) } }),
    ...(to && { weekStartDate: { lte: new Date(to) } }),
  };

  const weeks = await prisma.timesheetWeek.findMany({
    where: whereWeek,
    include: {
      user: true,
      entries: {
        where: {
          deletedAt: null,
          ...(projectId && { projectId: Number(projectId) }),
          ...(clientId && { clientId: Number(clientId) }),
        },
        include: {
          project: true,
          client: true,
        },
      },
    },
  });

  /* ---------------- FLATTEN ENTRIES BY DAY ---------------- */

  const daily = new Map(); // date => { total, billable, nonBillable }

  const detailedEntries = [];

  for (const w of weeks) {
    const start = new Date(w.weekStartDate);

    for (const e of w.entries) {
      const map = [
        [0, "mon"],
        [1, "tue"],
        [2, "wed"],
        [3, "thu"],
        [4, "fri"],
        [5, "sat"],
        [6, "sun"],
      ];

      for (const [offset, key] of map) {
        const hours = e[key];
        if (!hours || hours <= 0) continue;

        const d = new Date(start);
        d.setDate(start.getDate() + offset);
        const dateKey = d.toISOString().slice(0, 10);

        if (!daily.has(dateKey)) {
          daily.set(dateKey, {
            total: 0,
            billable: 0,
            nonBillable: 0,
          });
        }

        const day = daily.get(dateKey);
        day.total += hours;
        e.isBillable ? (day.billable += hours) : (day.nonBillable += hours);

        detailedEntries.push({
          id: `${e.id}-${key}`,
          entryDate: d,
          hours,
          isBillable: e.isBillable,
          project: e.project,
          client: e.client,
          timesheet: {
            user: w.user,
          },
        });
      }
    }
  }

  /* ---------------- BUILD CHART DATA ---------------- */

  const labels = Array.from(daily.keys()).sort();

  const chart = {
    labels,
    total: labels.map((d) => daily.get(d).total),
    billable: labels.map((d) => daily.get(d).billable),
    nonBillable: labels.map((d) => daily.get(d).nonBillable),
  };

  /* ---------------- SUMMARY ---------------- */

  const summary = {
    totalHours: chart.total.reduce((a, b) => a + b, 0),
    billableHours: chart.billable.reduce((a, b) => a + b, 0),
    nonBillableHours: chart.nonBillable.reduce((a, b) => a + b, 0),
  };

  return {
    summary,
    chart,
    entries: detailedEntries,
  };
}
