import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Users2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CalendarClock,
  CalendarCheck2,
  Kanban,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { toggleSidebarDropdown } from "../store/authSlice";

const menu = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Projects",
    path: "/projects",
    icon: FolderKanban,
    roles: ["ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Clients",
    path: "/clients",
    icon: Building2,
    roles: ["ADMIN", "HR_MANAGER"],
  },
  {
    label: "Users",
    path: "/users",
    icon: Users2,
    roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Calendar",
    path: "/calendar",
    icon: Calendar,
    roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
  },

  // GROUPED DROPDOWN
  {
    label: "Leaves",
    icon: CalendarDays,
    roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
    children: [
      {
        label: "Leave Dashboard",
        path: "/leaves",
        icon: Kanban,
        roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "My Leaves",
        path: "/request-leaves",
        icon: CalendarClock,
        roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "Leave Approval",
        path: "/leave-approvals",
        icon: CalendarCheck2,
        roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER"],
      },
    ],
  },
  {
    label: "Timesheet",
    icon: CalendarClock,
    roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
    children: [
      {
        label: "My Timesheet",
        path: "/timesheets/my",
        icon: CalendarClock,
        roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "Timesheet Approvals",
        path: "/timesheets/approvals",
        icon: CalendarCheck2,
        roles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER"],
      },
      {
        label: "Timesheet Reports",
        path: "/timesheets/reports",
        icon: Kanban,
        roles: ["ADMIN", "HR_MANAGER", "HR"],
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

  const openDropdowns = useSelector(
    (state: RootState) => state.auth.openSidebarDropdowns || null
  );

  const handleToggleDropdown = (label: string) => {
    dispatch(toggleSidebarDropdown(label));
  };

  return (
    <nav className="space-y-1 p-2">
      {menu
        .filter((item) => item.roles.includes(userRole))
        .map((item) => {
          const active = location.pathname === item.path;
          const hasChildren = !!item.children;

          // ------------------ SIMPLE ITEM ------------------
          if (!hasChildren) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onNavigate && onNavigate()}
                className={`flex items-center gap-2 p-2 rounded-lg transition
              ${
                active
                  ? "bg-[#1b335a] text-white font-semibold shadow-md"
                  : "text-[var(--text)] hover:bg-[#1b335a] dark:hover:bg-[#1b335a] hover:text-white"
              }
            `}
              >
                <item.icon size={18} className="cursor-pointer" />
                {item.label}
              </Link>
            );
          }

          // ------------------ DROPDOWN ITEM ------------------
          const isOpen = openDropdowns.includes(item.label);

          return (
            <div key={item.label}>
              <button
                onClick={() => handleToggleDropdown(item.label)}
                className={`flex w-full items-center justify-between p-2 rounded-lg transition text-[var(--text)]`}
              >
                <div className="w-full flex items-center gap-2 cursor-pointer">
                  <item.icon size={18} className="cursor-pointer" />
                  {item.label}
                </div>

                {isOpen ? (
                  <ChevronDown size={16} className="cursor-pointer" />
                ) : (
                  <ChevronRight size={16} className="cursor-pointer" />
                )}
              </button>

              {/* Children */}
              {isOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children
                    .filter((c) => c.roles.includes(userRole))
                    .map((child) => {
                      const childActive = location.pathname === child.path;

                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => onNavigate && onNavigate()}
                          className={`
                        flex items-center gap-2 p-2 rounded-lg transition
                        ${
                          childActive
                            ? "bg-[#1b335a] text-white font-semibold shadow-md"
                            : "text-[var(--text)] hover:bg-[#1b335a] dark:hover:bg-[#1b335a] hover:text-white"
                        }
                      `}
                        >
                          <child.icon size={18} className="cursor-pointer" />
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
