import { Link } from "react-router-dom";
import NotFoundImage from "../../assets/not_found.png";

export default function Page404() {
  return (
    <div className="flex flex-col space-y-6 items-center justify-center min-h-screen px-4 text-center bg-[var(--bg)] text-[var(--text)]">
      <h1 className="text-4xl text-[#2f4f82] md:text-5xl font-bold mb-4">
        Page Not Found
      </h1>

      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        The page you’re trying to access doesn’t exist or has been moved. Check
        the URL or return back to the dashboard.
      </p>

      <img
        src={NotFoundImage}
        alt="Not Found Illustration"
        className="w-64 md:w-80 mb-8"
      />

      <Link
        to="/"
        className="px-4 py-2 bg-[#2f4f82] hover:bg-[#1b335a] text-white rounded-lg font-medium transition"
        data-testid="Home"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
