import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { getTimesheetReport } from "../services/timesheetServices";
import { getUsers } from "../services/userServices";
import { getProjects } from "../services/projectServices";
import { getClients } from "../services/clientServices";

export default function TimesheetReports() {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [chart, setChart] = useState<any | null>(null);

  const [filters, setFilters] = useState({
    userId: "",
    projectId: "",
    clientId: "",
    from: "",
    to: "",
  });

  const [summary, setSummary] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load dropdown data in parallel
    Promise.all([
      getUsers(1, 100, "", "name", "asc"),
      getProjects(1, 100, "", "name", "asc"),
      getClients(1, 100, "", "name", "asc"),
    ])
      .then(([u, p, c]) => {
        setUsers(u.data || u.data?.data || u.data?.users || []);
        setProjects(p.data || p.data?.data || p.data?.projects || []);
        setClients(c.data || c.data?.data || c.data?.clients || []);
      })
      .catch(() => {
        // ignore – report pulls will still work if dropdowns fail
      });
  }, []);

  async function handleRun() {
    try {
      setLoading(true);
      const res = await getTimesheetReport({
        userId: filters.userId ? Number(filters.userId) : undefined,
        projectId: filters.projectId ? Number(filters.projectId) : undefined,
        clientId: filters.clientId ? Number(filters.clientId) : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      setSummary(res.data.summary);
      setEntries(res.data.entries);
      setChart(res.data.chart);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  function buildChartData(chart: any) {
    if (!chart) return [];

    return chart.labels.map((label: string, i: number) => ({
      date: label,
      total: chart.total[i],
      Billable: chart.billable[i],
      NonBillable: chart.nonBillable[i],
    }));
  }

  return (
    <div className="max-h-auto">
      <h1 className="text-2xl font-semibold mb-4">Timesheet Reports</h1>

      {/* Filters */}
      <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-3 sm:p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={filters.userId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, userId: e.target.value }))
            }
            className="border border-[var(--border)] rounded-lg p-2 bg-[var(--card)] text-[var(--text)]"
          >
            <option value="">All Employees</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={filters.projectId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, projectId: e.target.value }))
            }
            className="border border-[var(--border)] rounded-lg p-2 bg-[var(--card)] text-[var(--text)]"
          >
            <option value="">All Projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filters.clientId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, clientId: e.target.value }))
            }
            className="border border-[var(--border)] rounded-lg p-2 bg-[var(--card)] text-[var(--text)]"
          >
            <option value="">All Clients</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, from: e.target.value }))
            }
            className="border border-[var(--border)] rounded-lg p-2 bg-[var(--card)] text-[var(--text)]"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, to: e.target.value }))
            }
            className="border border-[var(--border)] rounded-lg p-2 bg-[var(--card)] text-[var(--text)]"
          />

          <button
            onClick={handleRun}
            className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white text-sm font-medium hover:bg-[#1b335a]"
          >
            Run Report
          </button>
        </div>
      </div>

      {/* Summary */}
      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 border border-[var(--border)] rounded-xl bg-[var(--card)]">
            <p className="text-xs text-gray-500">Total Hours</p>
            <p className="text-xl font-bold">{summary.totalHours}</p>
          </div>
          <div className="p-3 border border-[var(--border)] rounded-xl bg-[var(--card)]">
            <p className="text-xs text-gray-500">Billable Hours</p>
            <p className="text-xl font-bold">{summary.billableHours}</p>
          </div>
          <div className="p-3 border border-[var(--border)] rounded-xl bg-[var(--card)]">
            <p className="text-xs text-gray-500">Non-Billable Hours</p>
            <p className="text-xl font-bold">{summary.nonBillableHours}</p>
          </div>
        </div>
      ) : null}

      {chart && (
        <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold mb-3">Daily Hours</h2>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={buildChartData(chart)}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar dataKey="Billable" stackId="a" fill="#4ade80" />
                <Bar dataKey="NonBillable" stackId="a" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Entries table */}
      {entries.length > 0 && (
        <div className="w-full overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--card)]">
          <table className="min-w-[600px] w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[
                  "Employee",
                  "Date",
                  "Project / Client",
                  "Hours",
                  "Billable",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.timesheet.user.name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(e.entryDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.project?.name || e.client?.name || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{e.hours}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.isBillable ? "Billable" : "Non-billable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !summary && (
        <div className="text-center text-gray-500 py-10">
          Run a report to see data
        </div>
      )}
    </div>
  );
}
