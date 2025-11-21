import { Building2, Users2, FolderKanban, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const cards = [
  { label: "Projects", count: 4, link: "/projects", icon: FolderKanban },
  { label: "Employees", count: 6, link: "/employees", icon: Users2 },
  { label: "Clients", count: 3, link: "/clients", icon: Building2 },
  { label: "Holidays", count: 12, link: "/calendar", icon: Calendar },
];

export default function Dashboard() {
  const user = useSelector((state: RootState) => state?.auth?.user);
  console.log(user);

  return (
    <div className="space-y-1">
      <h1 className="text-2xl md:text-3xl font-bold">
        👋 Welcome back, {user?.name}
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Manage users, clients, and projects at a glance.
      </p>

      <div className="grid grid-cols-1 py-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm p-5 md:p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full border border-[var(--border)] bg-[var(--icon-bg)]">
                <c.icon size={22} className="text-[var(--text)]" />
              </div>

              <h2 className="font-semibold text-lg">{c.label}</h2>
            </div>

            <div className="text-4xl font-bold mb-4">{c.count}</div>

            <Link to={c.link}>
              <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-500 font-medium">
                View details →
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
