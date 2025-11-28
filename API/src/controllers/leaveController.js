import {
  createLeaveService,
  getMyLeavesService,
  getTeamLeavesService,
  approveLeaveService,
  rejectLeaveService,
  cancelLeaveService,
  getLeaveDashboardService,
} from "../services/leaveService.js";

export async function createLeave(req, res) {
  try {
    res.status(201).json(await createLeaveService(req.user.id, req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getMyLeaves(req, res) {
  res.json(await getMyLeavesService(req.user.id));
}

export async function getTeamLeaves(req, res) {
  res.json(await getTeamLeavesService(req.user));
}

export async function approveLeave(req, res) {
  try {
    res.json(await approveLeaveService(req.user, Number(req.params.id)));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function rejectLeave(req, res) {
  try {
    res.json(await rejectLeaveService(req.user, Number(req.params.id)));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function cancelLeave(req, res) {
  try {
    res.json(await cancelLeaveService(req.user, Number(req.params.id)));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getLeaveDashboard(req, res) {
  res.json(await getLeaveDashboardService(req.user));
}
