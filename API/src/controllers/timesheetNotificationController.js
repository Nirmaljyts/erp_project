import {
  notifyTimesheetSubmitted,
  notifyTimesheetApproved,
  notifyTimesheetRejected,
} from "../services/timesheetNotificationService.js";

export async function timesheetSubmitted(req, res) {
  await notifyTimesheetSubmitted(req.body);
  res.json({ success: true });
}

export async function timesheetApproved(req, res) {
  await notifyTimesheetApproved(req.body);
  res.json({ success: true });
}

export async function timesheetRejected(req, res) {
  await notifyTimesheetRejected(req.body);
  res.json({ success: true });
}
