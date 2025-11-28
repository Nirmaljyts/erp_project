import { useEffect, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useNavigate } from "react-router-dom";
import { getLeaveDashboard } from "../services/leaveService";

export default function LeaveDashboard() {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  type Stat = { status: string; _count: number };
  const [stats, setStats] = useState<Stat[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await getLeaveDashboard();
      setLeaves(res.data.leaves);
      setStats(res.data.stats);
    } finally {
      setLoading(false);
    }
  }

  const navigateToLeaves = () => {
    navigate("/leave-approvals");
  };

  const leaveRequest = () => navigate("/request-leaves");

  const events = leaves.map((l: any) => ({
    id: l.id,
    title: `${l.user.name} (${l.type})`,
    start: l.startDate,
    end: new Date(
      new Date(l.endDate).setDate(new Date(l.endDate).getDate() + 1)
    ),
    allDay: true,
    color:
      l.status === "APPROVED"
        ? "#16801d"
        : l.status === "PENDING"
        ? "#95a5a6"
        : l.status === "REJECTED"
        ? "#bd4d4d"
        : "#a6b4bd",
  }));

  return (
    <div className="w-full">
      {/* PAGE TITLE */}
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">
        Leave Dashboard
      </h1>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          {/* --- STATS GRID --- */}
          <div className="grid  sx:grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-3">
            {["PENDING", "APPROVED", "REJECTED", "CANCELLED", "TOTAL"].map(
              (key) => {
                const count =
                  key === "TOTAL"
                    ? leaves.length
                    : stats.find((s: any) => s.status === key)?._count || 0;

                return (
                  <div
                    key={key}
                    className="p-3 sm:p-4 border border-[var(--border)] rounded-xl bg-[var(--card)] shadow-sm"
                  >
                    <p className="text-xs sm:text-sm text-gray-500">{key}</p>
                    <p
                      className="cursor-pointer text-xl sm:text-2xl font-bold hover:underline"
                      onClick={navigateToLeaves}
                    >
                      {count}
                    </p>
                  </div>
                );
              }
            )}
          </div>

          {/* --- REQUEST BUTTON --- */}
          <div className="flex justify-end mb-3 sm:mb-4">
            <button
              onClick={leaveRequest}
              className="px-4 py-2 text-sm sm:text-base rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              Request Leave
            </button>
          </div>

          {/* --- CALENDAR WRAPPER --- */}
          <div className="w-full overflow-x-auto bg-[var(--card)] rounded-xl border border-[var(--border)] p-2 sm:p-4 shadow-sm mb-6">
            <div className="">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events}
                headerToolbar={{
                  left: "title",
                  center: "",
                  right: "today prev,next",
                }}
                height="100%"
                contentHeight="auto"
                expandRows={true}
              />
            </div>
          </div>

          {/* --- TABLE SECTION --- */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm w-full">
            <h2 className="text-lg font-semibold mb-3">All Leaves</h2>

            <div className="w-full overflow-x-auto">
              <table className="min-w-[520px] w-full text-xs sm:text-sm border border-[var(--border)]">
                <thead>
                  <tr className="border-b border border-[var(--border)] ">
                    {["Employee", "Type", "Period", "Status"].map((head) => (
                      <th
                        key={head}
                        className="px-3 py-3 text-left text-[10px] sm:text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {leaves.length === 0 ? (
                    <tr className="border-t-2 border border-[var(--border)] ">
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No Leave Data
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l: any) => (
                      <tr
                        key={l.id}
                        className="border-b border border-[var(--border)] "
                      >
                        <td className="p-2 whitespace-nowrap">{l.user.name}</td>
                        <td className="p-2 whitespace-nowrap">{l.type}</td>
                        <td className="p-2 whitespace-nowrap">
                          {new Date(l.startDate).toLocaleDateString()} →{" "}
                          {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-2 font-semibold whitespace-nowrap">
                          {l.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
