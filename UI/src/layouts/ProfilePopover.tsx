import { useRef, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store/store";

export default function ProfilePopover() {
  const user = useSelector((state: RootState) => state.auth.user);
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <div className="relative" ref={popoverRef}>
      {/* Profile Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
    w-8 h-8 rounded-full 
    bg-gray-900 text-white 
    dark:bg-white dark:text-black
    flex items-center justify-center font-semibold
    border border-gray-400 
    dark:border-gray-600
    ring-2 ring-gray-300 dark:ring-0
    hover:opacity-90 transition
  "
      >
        {userInitial}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-3 w-48
            bg-[var(--card)] text-[var(--text)]
            border border-[var(--border)]
            rounded-xl shadow-lg overflow-hidden
            animate-fadeIn z-50
          "
        >
          <div className="p-3 border-b border-[var(--border)]">
            <p className="font-semibold truncate">{user?.name}</p>
            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="
              w-full text-left px-4 py-2 text-red-500 
              dark:hover:text-red-600 hover:font-semibold
              transition
            "
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
