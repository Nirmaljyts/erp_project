import { Building2, Users2, FolderKanban, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { getDashboardData } from "../services/dashboardServices";
import Tooltip from "../components/Tooltip";

export default function Dashboard() {
  const user = useSelector((state: RootState) => state?.auth?.user);
  const role = user?.role || "";

  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const today = new Date(Date.now());

  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  async function loadDashboardData(page = 1) {
    try {
      setLoading(true);

      const res = await getDashboardData();

      setProjectCount(res?.projects);
      setClientCount(res?.clients);
      setUserCount(res?.users);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const cards = [
    {
      label: "Projects",
      count: projectCount,
      link: "/projects",
      icon: FolderKanban,
      allowedRoles: ["ADMIN", "HR_MANAGER", "MANAGER", "EMPLOYEE"],
      style: "text-2xl",
    },
    {
      label: "Users",
      count: userCount,
      link: "/users",
      icon: Users2,
      allowedRoles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
      style: "text-2xl",
    },
    {
      label: "Clients",
      count: clientCount,
      link: "/clients",
      icon: Building2,
      allowedRoles: ["ADMIN", "HR_MANAGER"],
      style: "text-2xl",
    },
    {
      label: "Holidays",
      count: formattedDate,
      link: "/calendar",
      icon: Calendar,
      allowedRoles: ["ADMIN", "HR_MANAGER", "HR", "MANAGER", "EMPLOYEE"],
      style: "text-2xl text-[#3a63a4]",
    },
  ];

  return (
    <div className="max-h-auto w-full">
      {loading ? (
        <div v-if="isProcessing" className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              👋 Welcome back, {user?.name}
            </h1>

            <p className="flex items-center justify-start w-full text-gray-600 dark:text-gray-400">
              {role === "ADMIN" &&
                "Administrative interface, offering full control over users, clients, and projects."}

              {role === "HR_MANAGER" &&
                "Coordinate HR activities and ensure smooth workforce management."}

              {role === "HR" &&
                "Manage employees, roles, and their attendance."}

              {role === "MANAGER" &&
                "Track and manage your assigned projects and teams."}

              {role === "EMPLOYEE" &&
                "View your assigned projects and daily work details."}
            </p>

            <div className="grid grid-cols-1 py-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              {cards
                .filter((c) => c.allowedRoles.includes(role))
                .map((c) => (
                  <div
                    key={c.label}
                    className="bg-[var(--card)] border border-[var(--border)] 
                         rounded-xl shadow-sm p-5 md:p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-full border border-[var(--border)] bg-[var(--icon-bg)]">
                        <c.icon size={22} className="text-[var(--text)]" />
                      </div>

                      <h2 className="font-semibold text-lg">{c.label}</h2>
                    </div>

                    <div className={`font-bold mb-4 ${c.style}`}>{c.count}</div>

                    <Link to={c.link}>
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-[#2f4f82] font-medium">
                        <Tooltip text={`Go to ${c.label}`} position="right">
                          <span className="cursor-pointer">View details →</span>
                        </Tooltip>
                      </button>
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
