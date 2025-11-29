import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users2,
  Calendar,
  CalendarDays,
  Hourglass,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  CalendarCog,
  CalendarCheck2,
  Kanban,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { setOpenSidebarDropdown } from "../store/authSlice";

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

  // GROUPED DROPDOWN
  {
    label: "Leaves",
    icon: CalendarDays,
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    children: [
      {
        label: "Leave Dashboard",
        path: "/leaves",
        icon: Kanban,
        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "My Leaves",
        path: "/request-leaves",
        icon: CalendarClock,
        roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "Leave Approval",
        path: "/leave-approvals",
        icon: CalendarCheck2,
        roles: ["ADMIN", "HR", "MANAGER"],
      },
    ],
  },
];

type SidebarMenuProps = {
  onNavigate?: () => void;
};

export default function SidebarMenu({ onNavigate }: SidebarMenuProps) {
  const location = useLocation();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role || "";

  const openDropdown = useSelector(
    (state: RootState) => state.auth.openSidebarDropdown || null
  );

  const handleToggleDropdown = (label: string) => {
    if (openDropdown === label) {
      dispatch(setOpenSidebarDropdown(null));
    } else {
      dispatch(setOpenSidebarDropdown(label));
    }
  };

  return (
    <nav className="space-y-1 p-2">
      {menu
        .filter((item) => item.roles.includes(userRole))
        .map((item) => {
          const hasChildren = !!item.children;

          if (!hasChildren) {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onNavigate && onNavigate()}
                className={`flex items-center gap-3 p-2 rounded-lg transition border-[var(--border)]
            ${
              active
                ? "bg-black text-white border-gray-700 font-semibold dark:bg-[#1b335a] dark:text-white shadow-lg"
                : "text-[var(--text)] hover:bg-gray-200 dark:hover:bg-[#1b335a] hover:text-white"
            }
          `}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          }

          // --- DROPDOWN ITEM ---
          const isOpen = openDropdown === item.label;

          return (
            <div key={item.label}>
              <button
                onClick={() => handleToggleDropdown(item.label)}
                className="flex w-full items-center justify-between gap-3 p-2 rounded-lg text-md transition border-[var(--border)]
            text-[var(--text)] hover:bg-gray-200 dark:hover:bg-[#1b335a] hover:text-white"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>

                {isOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>

              {isOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {item
                    .children!.filter((c) => c.roles.includes(userRole))
                    .map((child) => {
                      const active = location.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => onNavigate && onNavigate()}
                          className={`flex items-center gap-3 p-2 rounded-lg transition border-[var(--border)]
                      ${
                        active
                          ? "bg-black text-white border-gray-700 font-semibold dark:bg-[#1b335a] dark:text-white shadow-lg"
                          : "text-[var(--text)] hover:bg-gray-200 dark:hover:bg-[#1b335a] hover:text-white"
                      }
                    `}
                        >
                          <child.icon size={18} />
                          {child.label}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
    </nav>
  );
}
