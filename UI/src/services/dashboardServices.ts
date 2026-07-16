import { axiosInstance } from "./interceptor";

// LIST COUNTS IN DASHBOARD
export async function getDashboardData() {
  const res = await axiosInstance.get(`/dashboard`);
  return res.data;
}
