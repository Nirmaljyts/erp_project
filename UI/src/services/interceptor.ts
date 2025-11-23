import axios from "axios";
import serverConfig from "./serverConfig";
import { refreshToken } from "./authServices";
import Swal from "sweetalert2";

export const axiosInstance = axios.create({
  baseURL: serverConfig.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =======================
   REQUEST INTERCEPTOR
======================= */
axiosInstance.interceptors.request.use((request) => {
  const access = localStorage.getItem("token");

  if (access) {
    request.headers.Authorization = `Bearer ${access}`;
  }

  return request;
});

let isRefreshing = false;
let failedQueue: any[] = [];

/* Handle queued requests while refreshing token */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/* =======================
   RESPONSE INTERCEPTOR
======================= */
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    /* If email is wrong → send clean error */
    if (error.response?.status === 404) {
      return Promise.reject({
        response: { data: { message: "User not found" } },
      });
    }

    /* If password is wrong */
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Invalid password"
    ) {
      return Promise.reject({
        response: { data: { message: "Invalid password" } },
      });
    }

    // Access token expired → try refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
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
          allowOutsideClick: false,
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

/* =======================
   Refresh Access Token
======================= */
async function refreshAccessToken() {
  const refresh = localStorage.getItem("RefreshToken");

  if (!refresh) throw new Error("Refresh token missing");

  const res = await refreshToken();

  const newToken = res.data.accessToken;

  localStorage.setItem("token", newToken);

  return newToken;
}
