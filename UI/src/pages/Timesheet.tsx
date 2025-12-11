import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getMyTimesheet,
  saveTimesheetWeekApi,
  submitTimesheet,
} from "../services/timesheetServices";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

// ------------------------------------------------------------
// UTILITIES — FIXED TIMEZONE & DATE LOGIC
// ------------------------------------------------------------
function getMonday(d: Date) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = local.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + diff);
  return new Date(local.getFullYear(), local.getMonth(), local.getDate());
}

function formatISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isPast(dateStr: string) {
  const weekStart = new Date(dateStr);
  const thisMon = getMonday(new Date());
  return weekStart < thisMon; // ONLY compares YYYY-MM-DD safely
}

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------
interface TimesheetEntry {
  id?: number;
  projectId?: number | null;
  clientId?: number | null;

  project?: { id: number; name: string } | null;
  client?: { id: number; name: string } | null;

  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;

  isBillable: boolean;
  description?: string;
}

interface TimesheetWeek {
  id: number;
  weekStartDate: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  entries: TimesheetEntry[];
  approver?: { name: string } | null;
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------
export default function Timesheet() {
  const user = useSelector((state: RootState) => state.auth.user);
  const canSeeBillable = ["ADMIN", "MANAGER", "HR_MANAGER"].includes(
    user?.role || ""
  );

  const [week, setWeek] = useState<TimesheetWeek | null>(null);
  const [loading, setLoading] = useState(false);

  const [currentMonday, setCurrentMonday] = useState(() =>
    getMonday(new Date())
  );

  const weekEnd = new Date(currentMonday);
  weekEnd.setDate(weekEnd.getDate() + 6);

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-GB");
  }

  // ------------------------------------------------------------
  // LOAD WEEK
  // ------------------------------------------------------------
  useEffect(() => {
    loadWeek();
  }, [currentMonday]);

  async function loadWeek() {
    try {
      setLoading(true);
      const res = await getMyTimesheet(formatISO(currentMonday));
      setWeek(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load timesheet");
    } finally {
      setLoading(false);
    }
  }

  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

  // ------------------------------------------------------------
  // CALCULATE TOTALS
  // ------------------------------------------------------------
  const totals = week
    ? days.reduce((acc, d) => {
        acc[d] = week.entries.reduce((sum, r) => sum + (r[d] || 0), 0);
        return acc;
      }, {} as Record<(typeof days)[number], number>)
    : null;

  const weeklyTotal = week
    ? week.entries.reduce(
        (sum, r) => sum + r.mon + r.tue + r.wed + r.thu + r.fri + r.sat + r.sun,
        0
      )
    : 0;

  // ------------------------------------------------------------
  // LOCAL UPDATE FUNCTIONS
  // ------------------------------------------------------------
  function updateEntry(row: TimesheetEntry, field: string, value: any) {
    if (!week) return;

    const updated = { ...week };
    const target = updated.entries.find((e) => e.id === row.id);
    if (!target) return;

    (target as any)[field] = value;
    setWeek(updated);
  }

  function toggleBillable(row: TimesheetEntry) {
    if (!row.projectId) return; // prevent billable for special rows
    updateEntry(row, "isBillable", !row.isBillable);
  }

  function saveDescription(row: TimesheetEntry, desc: string) {
    if (row.projectId) return; // description only for special rows
    updateEntry(row, "description", desc);
  }

  // ------------------------------------------------------------
  // SAVE WEEK
  // ------------------------------------------------------------
  async function handleSave() {
    if (!week) return;

    try {
      await saveTimesheetWeekApi(week.id, {
        entries: week.entries,
      });

      toast.success("Timesheet saved");
      loadWeek();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save");
    }
  }

  // ------------------------------------------------------------
  // SUBMIT WEEK (now sends entries for auto-save)
  // ------------------------------------------------------------
  async function handleSubmit() {
    if (!week) return;

    try {
      await submitTimesheet(week.id, week.entries); // send latest UI edits
      toast.success("Submitted");
      loadWeek();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit");
    }
  }

  // ------------------------------------------------------------
  // CHANGE WEEK — FIXED VERSION
  // ------------------------------------------------------------
  function changeWeek(offset: number) {
    const base = new Date(
      currentMonday.getFullYear(),
      currentMonday.getMonth(),
      currentMonday.getDate()
    );
    base.setDate(base.getDate() + offset * 7);
    setCurrentMonday(getMonday(base));
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-4 flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Timesheet</h1>
          <p className="text-sm text-gray-500">
            Week of {formatDate(currentMonday)} - {formatDate(weekEnd)}
          </p>

          {week?.approver && (
            <p className="text-xs text-gray-500">
              Approver: {week.approver.name}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => changeWeek(-1)} className="btn">
            Prev Week
          </button>

          <button
            onClick={() => setCurrentMonday(getMonday(new Date()))}
            className="btn"
          >
            This Week
          </button>

          {/* <button onClick={() => changeWeek(1)} className="btn">
            {" "}
            Next Week{" "}
          </button> */}
        </div>
      </div>

      {/* TABLE */}
      {week && (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Project/Task</th>
                {days.map((d) => (
                  <th key={d} className="p-2 text-center uppercase">
                    {d}
                  </th>
                ))}
                {canSeeBillable && (
                  <th className="p-2 text-center">Billable</th>
                )}
                <th className="p-2 text-center">Notes</th>
              </tr>
            </thead>

            <tbody>
              {week.entries.map((row) => {
                const isSpecial = !row.projectId;
                const isPastWeek = isPast(week.weekStartDate);

                return (
                  <tr key={row.id} className="border-t">
                    <td className="p-2 font-semibold">
                      {row.project?.name ||
                        row.client?.name ||
                        row.description ||
                        "Row"}
                    </td>

                    {days.map((d) => (
                      <td key={d} className="p-1 text-center">
                        <input
                          type="number"
                          disabled={week.status !== "DRAFT" || isPastWeek}
                          min={0}
                          value={row[d]}
                          onChange={(e) =>
                            updateEntry(
                              row,
                              d,
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-16 border rounded p-1 text-center"
                        />
                      </td>
                    ))}

                    {canSeeBillable && (
                      <td className="p-2 text-center">
                        <button
                          disabled={isPastWeek || isSpecial}
                          onClick={() => toggleBillable(row)}
                          className={`px-2 py-1 rounded ${
                            row.isBillable
                              ? "bg-green-200 text-green-800"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {row.isBillable ? "Yes" : "No"}
                        </button>
                      </td>
                    )}

                    <td className="p-2 text-center">
                      {isSpecial ? (
                        <input
                          type="text"
                          disabled={week.status !== "DRAFT" || isPastWeek}
                          className="border rounded p-1 w-full"
                          defaultValue={row.description || ""}
                          onBlur={(e) => saveDescription(row, e.target.value)}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="p-2">Total</td>
                {days.map((d) => (
                  <td key={d} className="p-2 text-center">
                    {totals ? totals[d] : 0}
                  </td>
                ))}

                {canSeeBillable && <td></td>}

                <td className="p-2 text-center">{weeklyTotal}</td>
              </tr>
            </tfoot>
          </table>

          {/* BUTTONS */}
          {week.status === "DRAFT" && (
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Save
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Submit Week
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
