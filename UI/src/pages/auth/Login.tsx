import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { userLogin } from "../../services/authServices";
import { setCredentials } from "../../store/authSlice";
import LoginImage from "../../assets/login.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await userLogin({ email, password });

      toast.success(`Welcome back, ${data?.user?.name}`);
      dispatch(
        setCredentials({
          token: data.accessToken,
          user: data.user,
        })
      );

      navigate("/");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Login failed. Check credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex items-center justify-center bg-[#2f4f82]">
        <img
          src={LoginImage}
          alt="ERP Illustration"
          className="w-3/4 max-w-lg"
        />
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-lg border border-gray-300 bg-white 
                  px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-black
                "
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full rounded-lg border border-gray-300 bg-white 
                    px-3 py-2 pr-10 text-sm outline-none
                    focus:ring-2 focus:ring-black
                  "
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? (
                    <EyeOff size={18} className="cursor-pointer" />
                  ) : (
                    <Eye size={18} className="cursor-pointer" />
                  )}
                </button>
              </div>
            </div>

            <span
              className="flex items-center justify-end text-sm text-blue-700 mb-1 hover:underline cursor-pointer"
              onClick={() => navigate("/forgot-password")}
            >
              forget password?
            </span>

            {error && (
              <p className="text-sm text-red-600 bg-red-100 border border-red-300 rounded-md px-3 py-2">
                {error}
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
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
