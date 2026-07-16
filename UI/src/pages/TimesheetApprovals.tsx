import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getTimesheetApprovals,
  approveTimesheet,
  rejectTimesheet,
} from "../services/timesheetServices";
import EmptyStateComponent from "../components/EmptyStateComponent";

export default function TimesheetApprovals() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await getTimesheetApprovals();
      setWeeks(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  type DayLabel = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

  function getWeekDates(weekStart: string | Date) {
    const start = new Date(weekStart);
    const labels: DayLabel[] = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ];

    return labels.map((label, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { label, date: d };
    });
  }

  function summarizeWeek(entries: any[], leaveMap: Record<string, boolean>) {
    const days = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    for (const e of entries) {
      const map = [
        ["Mon", e.mon],
        ["Tue", e.tue],
        ["Wed", e.wed],
        ["Thu", e.thu],
        ["Fri", e.fri],
        ["Sat", e.sat],
        ["Sun", e.sun],
      ] as const;

      for (const [day, value] of map) {
        if (!value) continue;
        if (leaveMap[day.toLowerCase()]) continue;
        days[day] += value;
      }
    }

    const total = Object.entries(days).reduce((sum, [day, h]) => {
      return leaveMap[day.toLowerCase()] ? sum : sum + h;
    }, 0);

    return { days, total };
  }

  async function handleAction(id: number, type: "APPROVE" | "REJECT") {
    try {
      if (type === "APPROVE") {
        await approveTimesheet(id);
        toast.success("Timesheet approved");
      } else {
        await rejectTimesheet(id);
        toast.success("Timesheet rejected");
      }
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update timesheet");
    }
  }

  return (
    <div className="max-h-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <h1 className="text-2xl font-semibold">Timesheet Approvals</h1>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : weeks.length === 0 ? (
        <EmptyStateComponent name="Approval Timesheet" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weeks.map((w) => (
            <div
              key={w.id}
              className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between mb-1">
                <div>
                  <p className="font-semibold">{w.user?.name}</p>

                  <p className="text-xs text-gray-500">
                    Week of {new Date(w.weekStartDate).toLocaleDateString()}
                  </p>
                </div>

                <span className="h-6 flex items-center justify-center px-2 py-1 rounded-full text-xs bg-yellow-200 text-gray-700">
                  {w.status}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Entries: {w.entries?.length ?? 0}
              </div>

              {(() => {
                const { days, total } = summarizeWeek(w.entries, w.leaveMap);
                const weekDates = getWeekDates(w.weekStartDate);

                return (
                  <>
                    <div className="mt-3 text-xs space-y-1">
                      {weekDates.map(({ label, date }) => (
                        <div key={label} className="flex justify-between">
                          <span>
                            {label} ({date.toLocaleDateString()})
                          </span>

                          <span className="font-medium">
                            {w.leaveMap[label.toLowerCase()]
                              ? "Leave"
                              : `${days[label]}h`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t flex justify-between text-sm font-semibold">
                      <span>Total</span>

                      <span>{total}h</span>
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAction(w.id, "REJECT")}
                  className="flex-1 bg-red-600 text-white text-sm py-1 rounded hover:bg-red-700"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleAction(w.id, "APPROVE")}
                  className="flex-1 bg-[#2f4f82] text-white text-sm py-1 rounded hover:bg-[#1b335a]"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
