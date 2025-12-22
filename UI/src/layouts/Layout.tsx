import { Outlet, useNavigate } from "react-router-dom";
import { Sun, Moon, Menu, X, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import SidebarMenu from "./SidebarMenu";
import ProfilePopover from "./ProfilePopover";
import Tooltip from "../components/Tooltip";
import { getNotifications } from "../services/notificationService";
import NotificationSidebar from "./NotificationSidebar";

export default function Layout() {
  const [theme, setTheme] = useState(localStorage.theme || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.theme = theme;
  }, [theme]);

  const fetchUnreadCount = async () => {
    const res = await getNotifications();
    setUnreadCount(res.data.filter((n) => !n.isRead).length);
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const handler = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notifications-updated", handler);

    return () => {
      window.removeEventListener("notifications-updated", handler);
    };
  }, []);

  const headerNavigation = () => {
    setSidebarOpen(false);
    navigate("/");
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      cancelButtonColor: "#1b335a",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/login");

        toast.success(`Signed out`);
      }
    });
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-56 bg-[var(--card)] border-r border-[var(--border)] flex flex-col justify-between transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static`}
        >
          <div className="h-screen flex flex-col p-0">
            <div className="flex w-full items-center justify-between p-[13.5px] border-[var(--border)] border-b hover:cursor-pointer">
              <h1
                className="text-xl font-bold text-[#2f4f82] tracking-tight cursor-pointer"
                onClick={headerNavigation}
              >
                ERP COMPANY
              </h1>

              <span className="cursor-pointer lg:hidden hover:text-gray-600 hover:cursor-pointer">
                <Tooltip text="Close" position="bottom">
                  <X
                    className="cursor-pointer"
                    size={20}
                    onClick={() => setSidebarOpen(false)}
                  />
                </Tooltip>
              </span>
            </div>

            <div className="overflow-y-auto flex-1">
              <SidebarMenu onNavigate={() => setSidebarOpen(false)} />
            </div>

            <div className="border-t border-[var(--border)] py-2 px-4">
              <button
                className="flex items-center gap-2 text-lg text-red-500 hover:text-red-600 hover:font-semibold"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Section */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="h-14 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between lg:justify-end px-2 lg:px-4 gap-4">
            <button
              className="lg:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => setSidebarOpen(true)}
            >
              <Tooltip text="Toggle" position="right">
                <Menu size={20} className="cursor-pointer" />
              </Tooltip>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setNotificationOpen(true)}
                className="relative p-1.5 rounded-full border border-gray-200 dark:border-gray-700"
              >
                <Bell size={18} className="cursor-pointer" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-900  transition"
              >
                {theme === "light" ? (
                  <Tooltip text="Dark Theme" position="bottom">
                    <Moon size={18} className="cursor-pointer" />
                  </Tooltip>
                ) : (
                  <Tooltip text="Light Theme" position="bottom">
                    <Sun size={18} className="text-yellow-400 cursor-pointer" />
                  </Tooltip>
                )}
              </button>

              <ProfilePopover />
            </div>
          </header>

          {/* Main Contents */}
          <main className="flex-1 w-full min-w-0 overflow-y-auto p-2 sm:p-4">
            <Outlet />
          </main>
        </div>
      </div>

      <NotificationSidebar
        open={notificationOpen}
        onClose={() => {
          setNotificationOpen(false);
          fetchUnreadCount();
        }}
        onRead={fetchUnreadCount}
      />
    </>
  );
}
