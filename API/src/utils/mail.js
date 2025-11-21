import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to, code) {
  const info = await transporter.sendMail({
    from: `"ERP System" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your OTP Code",
    text: `Your OTP code is ${code}. It will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
  });

  console.log("OTP email sent:", info.messageId);
}
