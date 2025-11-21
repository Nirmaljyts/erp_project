import { Outlet, useNavigate } from "react-router-dom";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SidebarMenu from "./SidebarMenu";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import ProfilePopover from "./ProfilePopover";

export default function Layout() {
  const [theme, setTheme] = useState(localStorage.theme || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.theme = theme;
  }, [theme]);

  const user = useSelector((state: RootState) => state?.auth?.user);

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Confirm",
      cancelButtonText: "No",
      cancelButtonColor: "#1b335a",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");

        Swal.fire({
          title: "Logged out",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--card)] border-r border-[var(--border)] p-0 flex flex-col justify-between transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6 hover:cursor-pointer">
            <h1
              className="text-xl font-bold tracking-tight"
              onClick={() => navigate("/")}
            >
              ERP COMPANY
            </h1>

            <span className="lg:hidden hover:text-gray-600">
              <X size={20} onClick={() => setSidebarOpen(false)} />
            </span>
          </div>

          <SidebarMenu />
        </div>

        <div className="border-t border-[var(--border)] py-2 px-4">
          <button
            className="flex items-center gap-2 text-lg text-red-500 hover:text-red-600 hover:font-semibold"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Navvigation Bar */}
        <header
          className="
            h-16 bg-[var(--card)] border-b border-[var(--border)]
            flex items-center justify-between lg:justify-end
            px-4 lg:px-6 gap-4
          "
        >
          <button
            className="lg:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition"
            >
              {theme === "light" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} className="text-yellow-400" />
              )}
            </button>

            <ProfilePopover />
          </div>
        </header>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
