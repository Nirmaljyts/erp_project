import { axiosInstance } from "./interceptor";

export function getMyLeaves(page = 1, limit = 10) {
  return axiosInstance.get("/leaves/my", {
    params: { page, limit },
  });
}

export function applyLeave(data: any) {
  return axiosInstance.post("/leaves", data);
}

export function cancelLeave(id: number) {
  return axiosInstance.post(`/leaves/${id}/cancel`);
}

export function getPendingLeaves(page = 1, limit = 10) {
  return axiosInstance.get("/leaves/team", {
    params: { page, limit },
  });
}

export function approveLeave(id: number) {
  return axiosInstance.post(`/leaves/${id}/approve`);
}

export function rejectLeave(id: number) {
  return axiosInstance.post(`/leaves/${id}/reject`);
}

export function getLeaveDashboard(page = 1, limit = 10) {
  return axiosInstance.get("/leaves/dashboard", {
    params: { page, limit },
  });
}

export async function deleteApprovedLeave(id: number) {
  const res = await axiosInstance.delete(`/leaves/approved/${id}`);
  return res.data;
}
