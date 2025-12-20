import nodemailer from "nodemailer";
import prisma from "../utils/prisma.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(userId, subject, text) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return;

  await transporter.sendMail({
    to: user.email,
    subject,
    text,
  });
}
