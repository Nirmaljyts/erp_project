import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestResetOtp } from "../services/authService";
import forgotPassword from "../assets/forgot_password.png";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    try {
      const res = await requestResetOtp(email);

      setMsg(res.data.message || "OTP sent to your email");
      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      
      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex items-center justify-center bg-gray-100">
        <img
          src={forgotPassword}
          className="w-3/4 max-w-lg"
          alt="ERP Forgot Password"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Forgot Password
          </h1>

          <p className="text-gray-600 text-center mb-6 text-sm">
            Enter your email. We’ll send you a 6-digit OTP to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {/* Success */}
            {msg && (
              <p className="text-sm text-green-600 bg-green-100 border border-green-300 rounded-md px-3 py-2">
                {msg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full rounded-lg bg-[#2f4f82] text-white font-medium
                py-2 text-sm hover:bg-[#1b335a] disabled:opacity-60
              "
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          {/* Back to Login */}
          <p className="text-center text-sm mt-4">
            <button
              onClick={() => navigate("/login")}
              className="text-blue-700 hover:underline"
            >
              Back to Login
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
