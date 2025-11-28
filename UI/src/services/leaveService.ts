import { axiosInstance } from "./interceptor";

export function getMyLeaves() {
  return axiosInstance.get("/leaves/my");
}

export function applyLeave(data: any) {
  return axiosInstance.post("/leaves", data);
}

export function cancelLeave(id: number) {
  return axiosInstance.post(`/leaves/${id}/cancel`);
}

export function getPendingLeaves() {
  return axiosInstance.get("/leaves/team");
}

export function approveLeave(id: number) {
  return axiosInstance.post(`/leaves/${id}/approve`);
}

export function rejectLeave(id: number) {
  return axiosInstance.post(`/leaves/${id}/reject`);
}

export function getLeaveDashboard() {
  return axiosInstance.get("/leaves/dashboard");
}
