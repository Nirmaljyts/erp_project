import { notify } from "./notificationService.js";

/* =========================
   TIMESHEET NOTIFICATIONS
========================= */

export async function notifyTimesheetSubmitted({ approverId, employeeName, ts }) {
  await notify({
    userId: approverId,
    type: "TIMESHEET_SUBMITTED",
    title: "Timesheet approval required",
    message: `${employeeName} submitted a timesheet`,
    entityId: ts.id,
    email: true,
  });
}

export async function notifyTimesheetApproved({ employeeId, timesheetId }) {
  await notify({
    userId: employeeId,
    type: "TIMESHEET_APPROVED",
    title: "Timesheet approved",
    message: "Your timesheet was approved",
    entityId: timesheetId, // ✅ FIXED
    email: true,
  });
}

export async function notifyTimesheetRejected({ employeeId, timesheetId }) {
  await notify({
    userId: employeeId,
    type: "TIMESHEET_REJECTED",
    title: "Timesheet rejected",
    message: "Your timesheet was rejected",
    entityId: timesheetId,
    email: true,
  });
}
