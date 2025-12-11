import { axiosInstance } from "./interceptor";

export function getMyTimesheet(weekStart?: string) {
  return axiosInstance.get("/timesheets/my", {
    params: weekStart ? { weekStart } : undefined,
  });
}

// Save individual day entry
export function saveTimesheetEntry(payload: {
  id: number | undefined;
  weekStart: string;
  projectId: number | null | undefined;
  clientId: number | null | undefined;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  isBillable: boolean;
  description: string | undefined;
}) {
  return axiosInstance.post("/timesheets/entry", payload);
}

export function saveTimesheetWeekApi(weekId: number, body: any) {
  return axiosInstance.post(`/timesheets/${weekId}/save`, body);
}

export function submitTimesheet(weekId: number, entries: any[]) {
  return axiosInstance.post(`/timesheets/${weekId}/submit`, { entries });
}

export function getTimesheetApprovals() {
  return axiosInstance.get("/timesheets/approvals");
}

export function approveTimesheet(weekId: number) {
  return axiosInstance.post(`/timesheets/${weekId}/approve`);
}

export function rejectTimesheet(weekId: number) {
  return axiosInstance.post(`/timesheets/${weekId}/reject`);
}

export function getTimesheetReport(params: {
  userId?: number;
  projectId?: number;
  clientId?: number;
  from?: string;
  to?: string;
}) {
  return axiosInstance.get("/timesheets/reports", { params });
}

// Timesheet Definitions (ADMIN / HR_MANAGER only)
export function getDefinitions() {
  return axiosInstance.get("/timesheets/definitions");
}

export function createDefinition(data: {
  type: string; // "PROJECT" | "SPECIAL"
  projectId?: number | null;
  description?: string | null;
  appliesTo: string; // ALL | EMPLOYEE | MANAGER | HR | HR_MANAGER
}) {
  return axiosInstance.post("/timesheets/definitions", data);
}

export function updateDefinition(id: number, data: any) {
  return axiosInstance.put(`/timesheets/definitions/${id}`, data);
}

export function deleteDefinition(id: number) {
  return axiosInstance.delete(`/timesheets/definitions/${id}`);
}
