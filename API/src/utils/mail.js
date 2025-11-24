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
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 5;

  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background-color:#f5f7fa; padding:20px;">
    <div style="max-width:500px;margin:auto;background:#ffffff;border-radius:10px;padding:25px;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="color:#2f4f82;text-align:center;margin-bottom:10px;">🔐 OTP Verification</h2>
      
      <p style="font-size:14px;color:#555;">
        Use the following One-Time Password to verify your account:
      </p>
      
      <div style="text-align:center;margin:25px 0;">
        <span style="font-size:32px;font-weight:700;color:#2f4f82;letter-spacing:4px;">
          ${code}
        </span>
      </div>
      
      <p style="font-size:14px;color:#555;">
        This code will expire in <strong>${expiryMinutes} minutes</strong>.
      </p>
      
      <p style="font-size:12px;color:#777;margin-top:25px;text-align:center;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
    
    <p style="text-align:center;font-size:11px;color:#999;margin-top:20px;">
      © ${new Date().getFullYear()} ERP System — All Rights Reserved
    </p>
  </div>
  `;

  const info = await transporter.sendMail({
    from: `"ERP System" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your OTP Code",
    html: htmlTemplate,
  });

  console.log("OTP email sent:", info.messageId);
}
