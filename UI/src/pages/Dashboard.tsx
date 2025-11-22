import { Building2, Users2, FolderKanban, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useEffect, useState } from "react";
import { getDashboardData } from "../services/dashboardServices";

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
      allowedRoles: ["ADMIN", "MANAGER", "EMPLOYEE"],
      style: "text-2xl",
    },
    {
      label: "Users",
      count: userCount,
      link: "/users",
      icon: Users2,
      allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      style: "text-2xl",
    },
    {
      label: "Clients",
      count: clientCount,
      link: "/clients",
      icon: Building2,
      allowedRoles: ["ADMIN"],
      style: "text-2xl",
    },
    {
      label: "Holidays",
      count: formattedDate,
      link: "/calendar",
      icon: Calendar,
      allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      style: "text-2xl",
    },
  ];

  return (
    <div className="max-h-auto">
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

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {role === "ADMIN" &&
                "Admin panel — full control over users, clients, and projects."}

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
                      <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-500 font-medium">
                        View details →
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
