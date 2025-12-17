import {
  getMyTimesheetWeekService,
  saveSingleEntryService,
  saveTimesheetWeekService,
  submitTimesheetWeekService,
  createDefinitionService,
  listDefinitionsService,
  updateDefinitionService,
  deleteDefinitionService,
  getTimesheetApprovalsService,
  approveTimesheetService,
  rejectTimesheetService,
  getTimesheetReportService,
} from "../services/timesheetService.js";

// ----------------------------------------- TIMESHEET -----------------------------------------

export async function getMyTimesheetController(req, res) {
  try {
    const data = await getMyTimesheetWeekService(
      req.user.id,
      req.query.weekStart
    );
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function saveSingleEntryController(req, res) {
  try {
    const entry = await saveSingleEntryService(req.user.id, req.body);
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function saveTimesheetWeekController(req, res) {
  try {
    const data = await saveTimesheetWeekService(
      req.user.id,
      Number(req.params.weekId),
      req.body.entries
    );
    res.json({ message: "Saved", data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function submitTimesheetController(req, res) {
  try {
    const data = await submitTimesheetWeekService(
      req.user.id,
      Number(req.params.weekId),
      req.body.entries || []
    );
    res.json({ message: "Submitted", data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ----------------------------------------- TIMESHEET APPROVAL -----------------------------------------

export async function getTimesheetApprovalsController(req, res) {
  try {
    const data = await getTimesheetApprovalsService(req.user);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function approveTimesheetController(req, res) {
  try {
    const weekId = Number(req.params.weekId);
    const data = await approveTimesheetService(req.user.id, weekId);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function rejectTimesheetController(req, res) {
  try {
    const weekId = Number(req.params.weekId);
    const data = await rejectTimesheetService(req.user.id, weekId);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

// ----------------------------------------- TIMESHEET DEFINITION -----------------------------------------

export async function createDefinitionController(req, res) {
  try {
    const def = await createDefinitionService(req.body);
    res.json(def);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function listDefinitionsController(req, res) {
  try {
    res.json(await listDefinitionsService());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateDefinitionController(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const updated = await updateDefinitionService(id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteDefinitionController(req, res) {
  try {
    await deleteDefinitionService(Number(req.params.id));
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ----------------------------------------- TIMESHEET REPORT -----------------------------------------

export async function getTimesheetReportController(req, res) {
  try {
    const data = await getTimesheetReportService(req.query, req.user);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
