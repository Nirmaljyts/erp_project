import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import { generateTokens } from "../utils/jwt.js";
import { sendOtpEmail } from "../utils/mail.js";

// REGISTER
export async function registerUser({ name, email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role || "EMPLOYEE",
      isActive: true,
    },
  });

  delete user.password;
  return user;
}

// LOGIN
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // User missing or disabled = pretend they don’t exist
  if (!user || !user.isActive) {
    throw new Error("User not found");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid password");

  const { accessToken, refreshToken } = generateTokens(user);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

// ME
export async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
}

// SEND OTP
export async function sendResetOtp(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.create({
    data: { email, code, expiresAt, used: false, userId: user.id },
  });

  await sendOtpEmail(email, code);
}

// VERIFY OTP
export async function verifyResetOtp(email, code) {
  const record = await prisma.otpCode.findFirst({
    where: { email, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new Error("Invalid or expired OTP");

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { used: true },
  });
}

// RESET PASSWORD
export async function resetPasswordService(email, newPassword) {
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });
}
