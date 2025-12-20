import { notify } from "./notificationService.js";

export async function notifyLeaveRequested(leave) {
  await notify({
    userId: leave.approverId,
    type: "LEAVE_REQUESTED",
    title: "New leave request",
    message: `${leave.employee.name} requested leave`,
    entityId: leave.id,
    email: true,
  });
}

export async function notifyLeaveApproved(leave) {
  await notify({
    userId: leave.employeeId,
    type: "LEAVE_APPROVED",
    title: "Leave approved",
    message: "Your leave request has been approved",
    entityId: leave.id,
    email: true,
  });
}

export async function notifyLeaveRejected(leave) {
  await notify({
    userId: leave.employeeId,
    type: "LEAVE_REJECTED",
    title: "Leave rejected",
    message: "Your leave request was rejected",
    entityId: leave.id,
    email: true,
  });
}

export async function notifyLeaveDeleted(leave) {
  await notify({
    userId: leave.employeeId,
    type: "LEAVE_DELETED",
    title: "Leave deleted",
    message: "An approved leave was deleted",
    entityId: leave.id,
    email: true,
  });
}
