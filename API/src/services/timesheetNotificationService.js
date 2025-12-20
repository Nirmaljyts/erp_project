import { notify } from "./notificationService.js";

export async function notifyTimesheetSubmitted(ts) {
  await notify({
    userId: ts.approverId,
    type: "TIMESHEET_SUBMITTED",
    title: "Timesheet submitted",
    message: "A timesheet is awaiting approval",
    entityId: ts.id,
    email: true,
  });
}

export async function notifyTimesheetApproved(ts) {
  await notify({
    userId: ts.employeeId,
    type: "TIMESHEET_APPROVED",
    title: "Timesheet approved",
    message: "Your timesheet was approved",
    entityId: ts.id,
    email: true,
  });
}

export async function notifyTimesheetRejected(ts) {
  await notify({
    userId: ts.employeeId,
    type: "TIMESHEET_REJECTED",
    title: "Timesheet rejected",
    message: "Your timesheet was rejected",
    entityId: ts.id,
    email: true,
  });
}
