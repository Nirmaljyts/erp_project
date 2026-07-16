import {
  createLeaveService,
  getMyLeavesService,
  getTeamLeavesService,
  approveLeaveService,
  rejectLeaveService,
  cancelLeaveService,
  getLeaveDashboardService,
  deleteApprovedLeaveService,
} from "../services/leaveService.js";

export async function createLeave(req, res) {
  try {
    res.status(201).json(await createLeaveService(req.user.id, req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getMyLeaves(req, res) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const result = await getMyLeavesService(req.user.id, page, limit);
  res.json(result);
}

export async function getTeamLeaves(req, res) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  const result = await getTeamLeavesService(req.user, page, limit);
  res.json(result);
}

export const approveLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const reviewerId = req.user.id;

    const result = await approveLeaveService(leaveId, reviewerId);
    res.json({ message: "Leave approved", data: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const reviewerId = req.user.id;

    const result = await rejectLeaveService(leaveId, reviewerId);
    res.json({ message: "Leave rejected", data: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export async function cancelLeave(req, res) {
  try {
    res.json(await cancelLeaveService(req.user, Number(req.params.id)));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getLeaveDashboard(req, res) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  res.json(await getLeaveDashboardService(req.user, page, limit));
}

export async function deleteApprovedLeaveController(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await deleteApprovedLeaveService(id);

    return res.json({ message: result });
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Failed to delete leave" });
  }
}
