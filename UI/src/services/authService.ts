import { axiosInstance } from "./interceptor";

export async function userLogin(data: { email: string; password: string }) {
  return axiosInstance.post("/auth/login", data).then((res) => res.data);
}

export async function refreshToken() {
  return axiosInstance.post("/auth/refresh", {
    refreshToken: localStorage.getItem("RefreshToken"),
  });
}

export function requestResetOtp(email: string) {
  return axiosInstance.post("/auth/password-reset/request-otp", { email });
}

export function verifyResetOtp(email: string, code: string) {
  return axiosInstance.post("/auth/password-reset/verify-otp", { email, code });
}

export function resetPassword(email: string, newPassword: string) {
  return axiosInstance.post("/auth/password-reset/reset", {
    email,
    newPassword,
  });
}
