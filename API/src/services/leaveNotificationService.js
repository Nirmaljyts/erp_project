import { notify } from "./notificationService.js";

export async function notifyLeaveRequested({ approverId, employee, id }) {
  await notify({
    userId: approverId,
    type: "LEAVE_REQUESTED",
    title: "Leave approval required",
    message: `${employee.name} requested leave`,
    entityId: id,
    email: true,
  });
}

export async function notifyLeaveApproved({ employeeId, id }) {
  await notify({
    userId: employeeId,
    type: "LEAVE_APPROVED",
    title: "Leave approved",
    message: "Your leave request has been approved",
    entityId: id,
    email: true,
  });
}

export async function notifyLeaveRejected({ employeeId, id }) {
  await notify({
    userId: employeeId,
    type: "LEAVE_REJECTED",
    title: "Leave rejected",
    message: "Your leave request was rejected",
    entityId: id,
    email: true,
  });
}

export async function notifyLeaveDeleted({ employeeId, id }) {
  await notify({
    userId: employeeId,
    type: "LEAVE_DELETED",
    title: "Leave deleted",
    message: "An approved leave was deleted",
    entityId: id,
    email: true,
  });
}
