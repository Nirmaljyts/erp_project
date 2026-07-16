import axios from "axios";
import serverConfig from "./serverConfig";
import { refreshToken } from "./authServices";
import Swal from "sweetalert2";

export const axiosInstance = axios.create({
  baseURL: serverConfig.API_URL,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((request) => {
  const access = localStorage.getItem("token");
  if (access) request.headers.Authorization = `Bearer ${access}`;
  return request;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Wrong password
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Invalid password"
    ) {
      return Promise.reject({
        response: { data: { message: "Invalid password" } },
      });
    }

    // Token expired → refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        ).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);

        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        Swal.fire({
          title: "Session Expired",
          text: "Please log in again.",
          icon: "warning",
          confirmButtonText: "OK",
          confirmButtonColor: "#2f4f82",
        }).then(() => {
          localStorage.clear();
          window.location.href = "/login";
        });
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  const refresh = localStorage.getItem("RefreshToken");
  if (!refresh) throw new Error("Refresh token missing");

  const res = await refreshToken();
  const newToken = res.data.accessToken;

  localStorage.setItem("token", newToken);
  return newToken;
}
