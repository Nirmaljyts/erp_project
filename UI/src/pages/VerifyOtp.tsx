import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyResetOtp } from "../services/authService";
import otpImage from "../assets/verify_otp.png";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Handle OTP box input
  const handleOtpChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto move focus
      if (value && index < 5) {
        const next = document.getElementById(`otp-${index + 1}`);
        next?.focus();
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");

    const code = otp.join("");

    if (code.length !== 6) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      await verifyResetOtp(email, code);
      setMsg("OTP verified successfully!");

      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if accessed directly
  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* LEFT IMAGE */}
      <div className="hidden lg:flex items-center justify-center bg-gray-100">
        <img src={otpImage} alt="OTP Verification" className="w-3/4 max-w-lg" />
      </div>

      {/* RIGHT FORM */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Verify OTP
          </h1>

          <p className="text-gray-600 text-center mb-6 text-sm">
            Enter the 6-digit OTP sent to <span className="font-semibold">{email}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* OTP Inputs */}
            <div className="flex justify-between">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  className="
                    w-12 h-12 text-center text-xl font-semibold
                    border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-sky-500 outline-none
                  "
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {msg && (
              <p className="text-sm text-green-600 bg-green-100 border border-green-300 rounded-md px-3 py-2">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full rounded-lg bg-[#2f4f82] text-white font-medium
                py-2 text-sm hover:bg-[#1b335a] disabled:opacity-60
              "
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-blue-700 hover:underline"
            >
              Back
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
