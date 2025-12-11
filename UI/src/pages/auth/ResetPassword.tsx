import { FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../services/authServices";
import resetImage from "../../assets/reset_password.png";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  //   if (!email) {
  //     navigate("/forgot-password");
  //     return null;
  //   }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, newPassword);

      setMsg("Password reset successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* LEFT SIDE IMAGE */}
      <div className="hidden lg:flex items-center justify-center bg-[#2f4f82]">
        <img src={resetImage} alt="Reset Password" className="w-3/4 max-w-lg" />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Reset Password
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="
                w-full rounded-lg bg-[#2f4f82] text-white font-medium
                py-2 hover:bg-[#1b335a] disabled:opacity-60
              "
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

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
