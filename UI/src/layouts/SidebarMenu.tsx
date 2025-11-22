import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users2,
  Calendar,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const menu = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
    roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Clients",
    path: "/clients",
    icon: Building2,
    roles: ["ADMIN"],
  },
  {
    label: "Users",
    path: "/users",
    icon: Users2,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Calendar",
    path: "/calendar",
    icon: Calendar,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
];

type SidebarMenuProps = {
  onNavigate?: () => void;
};

export default function SidebarMenu({ onNavigate }: SidebarMenuProps) {
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role || "";

  return (
    <nav className="space-y-2">
      {menu
        .filter((item) => item.roles.includes(userRole))
        .map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onNavigate && onNavigate()}
              className={`flex items-center gap-3 p-2 rounded-lg text-md transition border-[var(--border)]
                hover:font-semibold
                ${
                  active
                    ? "bg-black text-white border-gray-700 font-semibold dark:bg-white dark:text-black shadow-lg"
                    : "text-[var(--text)] hover:bg-gray-200 dark:hover:bg-gray-400"
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
