import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getTimesheetApprovals,
  approveTimesheet,
  rejectTimesheet,
} from "../services/timesheetServices";

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
    <div className="max-h-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Timesheet Approvals</h1>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : weeks.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No pending Timesheets
        </div>
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
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                  {w.status}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Entries: {w.entries?.length ?? 0}
              </div>

              <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                {w.entries.map((e: any) => (
                  <div key={e.id} className="flex justify-between py-0.5">
                    <span>
                      {new Date(e.entryDate).toLocaleDateString()} •{" "}
                      {e.project?.name || e.client?.name || "General"}
                    </span>
                    <span>
                      {e.hours}h {e.isBillable ? "(B)" : "(NB)"}
                    </span>
                  </div>
                ))}
              </div>

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
