import { axiosInstance } from "./interceptor";

// LOGIN
export async function userLogin(data: { email: string; password: string }) {
  const res = await axiosInstance.post("/auth/login", data);

  localStorage.setItem("token", res.data.accessToken);
  localStorage.setItem("RefreshToken", res.data.refreshToken);

  return res.data;
}

// REFRESH TOKEN
export async function refreshToken() {
  return axiosInstance.post("/auth/refresh", {
    refreshToken: localStorage.getItem("RefreshToken"),
  });
}

// RESET OTP REQUEST
export function requestResetOtp(email: string) {
  return axiosInstance.post("/auth/password-reset/request-otp", { email });
}

// VERIFY OTP
export function verifyResetOtp(email: string, code: string) {
  return axiosInstance.post("/auth/password-reset/verify-otp", { email, code });
}

// VERIFY PASSWORD
export function resetPassword(email: string, newPassword: string) {
  return axiosInstance.post("/auth/password-reset/reset", {
    email,
    newPassword,
  });
}
