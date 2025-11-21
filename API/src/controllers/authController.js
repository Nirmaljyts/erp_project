import {
  registerUser,
  loginUser,
  getMe,
  sendResetOtp,
  verifyResetOtp,
  resetPasswordService,
} from "../services/authService.js";

// REGISTRATION
export async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    return res.json(result);
  } catch (err) {
    if (err.message === "User not found")
      return res.status(404).json({ message: "User not found" });

    if (err.message === "Invalid password")
      return res.status(401).json({ message: "Invalid password" });

    return res.status(400).json({ message: err.message });
  }
}

// ME
export async function me(req, res) {
  try {
    const user = await getMe(req.user.id);
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch user" });
  }
}

// REQUEST OTP
export async function requestPasswordResetOtp(req, res) {
  try {
    await sendResetOtp(req.body.email);
    return res.json({ message: "OTP sent" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// VERIFY OTP
export async function verifyPasswordResetOtp(req, res) {
  try {
    await verifyResetOtp(req.body.email, req.body.code);
    return res.json({ message: "OTP verified" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// RESET PASSWORD
export async function resetPassword(req, res) {
  try {
    await resetPasswordService(req.body.email, req.body.newPassword);
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
