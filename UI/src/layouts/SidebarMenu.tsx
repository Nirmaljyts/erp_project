import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users2,
  Calendar,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menu = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Projects", path: "/projects", icon: FolderKanban },
  { label: "Clients", path: "/clients", icon: Building2 },
  { label: "Employees", path: "/employees", icon: Users2 },
  { label: "Calendar", path: "/calendar", icon: Calendar },
];

type SidebarMenuProps = {
  onNavigate?: () => void;
};

export default function SidebarMenu({ onNavigate }: SidebarMenuProps) {
  const location = useLocation();

  return (
    <nav className="space-y-2">
      {menu.map((item) => {
        const active = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => {
              if (onNavigate) onNavigate(); // Close sidebar on mobile/tablet
            }}
            className={`
              flex items-center gap-3 p-2 rounded-lg text-md transition border-[var(--border)]
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
