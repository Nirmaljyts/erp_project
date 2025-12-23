import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getMyTimesheet,
  saveTimesheetWeekApi,
  submitTimesheet,
} from "../services/timesheetServices";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

function getMonday(d: Date) {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = local.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + diff);
  return local;
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
  leaveMap: any;
  id: number;
  weekStartDate: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  entries: TimesheetEntry[];
  approver?: { name: string } | null;
}

export default function Timesheet() {
  const user = useSelector((state: RootState) => state.auth.user);
  const canSeeBillable = ["ADMIN", "MANAGER", "HR_MANAGER"].includes(
    user?.role || ""
  );

  const [week, setWeek] = useState<TimesheetWeek | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedMonday, setSelectedMonday] = useState(() =>
    getMonday(new Date())
  );

  const todayMonday = getMonday(new Date());

  const isPastWeek = selectedMonday < todayMonday;
  const isFutureWeek = selectedMonday > todayMonday;
  const isCurrentWeek = selectedMonday.getTime() === todayMonday.getTime();

  const weekEnd = new Date(selectedMonday);
  weekEnd.setDate(weekEnd.getDate() + 6);

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-GB");
  }

  useEffect(() => {
    loadWeek();
  }, [selectedMonday]);

  async function loadWeek() {
    try {
      setLoading(true);
      const res = await getMyTimesheet(formatISO(selectedMonday));

      setWeek(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load timesheet");
    } finally {
      setLoading(false);
    }
  }

  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

  // CALCULATE TOTALS
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

  // LOCAL UPDATE FUNCTIONS
  function updateEntry(row: TimesheetEntry, field: string, value: any) {
    if (!week) return;

    const updated = { ...week };
    const target = updated.entries.find((e) => e.id === row.id);
    if (!target) return;

    (target as any)[field] = value;
    setWeek(updated);
  }

  function toggleBillable(row: TimesheetEntry) {
    if (!row.projectId) return;
    updateEntry(row, "isBillable", !row.isBillable);
  }

  function saveDescription(row: TimesheetEntry, desc: string) {
    if (row.projectId) return;
    updateEntry(row, "description", desc);
  }

  // SAVE WEEK
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

  // SUBMIT WEEK (now sends entries for auto-save)
  async function handleSubmit() {
    if (!week) return;

    try {
      await submitTimesheet(week.id, week.entries);
      toast.success("Submitted");
      loadWeek();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit");
    }
  }

  // CHANGE WEEK — FIXED VERSION
  function changeWeek(offset: number) {
    const next = new Date(selectedMonday);
    next.setDate(next.getDate() + offset * 7);
    setSelectedMonday(next);
  }

  return (
    <div className="max-h-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Timesheet</h1>

          <p className="text-md text-gray-700 mt-2 dark:text-[var(--text)]">
            Week of {formatDate(selectedMonday)} - {formatDate(weekEnd)}
          </p>

          <p className="text-sm text-gray-700 dark:text-[var(--text)]">
            {week?.approver && week.status === "APPROVED" && (
              <span className="text-[#15ab2d]">
                Timesheet Approved By: {week.approver.name}
              </span>
            )}
            {week?.approver && week.status === "DRAFT" && (
              <span className="text-[#ff0000]">
                Timesheet Rejected By: {week.approver.name}
              </span>
            )}
            {week?.approver && week.status === "SUBMITTED" && (
              <span className="text-[#0062ff]">
                Timesheet has been submitted to the respective approver
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => changeWeek(-1)}
            className="btn rounded border border-[var(--border)] p-2 h-9 flex items-center justify-center"
            disabled={week?.entries?.length === 0}
          >
            Previous Week
          </button>

          <button
            onClick={() => setSelectedMonday(getMonday(new Date()))}
            className="btn rounded border border-[var(--border)] p-2 h-9 flex items-center justify-center"
            disabled={week?.entries?.length === 0}
          >
            Current Week
          </button>

          {/* <button
            onClick={() => changeWeek(1)}
            className="btn btn rounded border border-[var(--border)] p-2 h-9 flex items-center justify-center"
            disabled={week?.entries?.length === 0}
          >
            Next Week
          </button> */}
        </div>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          {week && (
            <div className="w-auto overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--card)]">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-auto text-xs p-2 text-left uppercase">
                      Project/Task
                    </th>

                    {days.map((d) => (
                      <th
                        key={d}
                        className="w-auto text-xs p-2 text-left uppercase"
                      >
                        {d}
                      </th>
                    ))}

                    {canSeeBillable && (
                      <th className="w-auto text-xs p-2 text-left uppercase">
                        Billable
                      </th>
                    )}

                    <th className="w-auto text-xs p-2 text-left uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {week.entries.map((row) => {
                    const isSpecial = !row.projectId;

                    return (
                      <tr
                        key={row.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="w-auto p-2 text-left font-semibold whitespace-nowrap">
                          {row.project?.name ||
                            row.client?.name ||
                            row.description}
                        </td>

                        {days.map((d) => (
                          <td key={d} className="w-auto p-0 text-left">
                            <div className="w-full">
                              <input
                                type="number"
                                disabled={
                                  week.status !== "DRAFT" ||
                                  isPastWeek ||
                                  isFutureWeek ||
                                  week.leaveMap?.[d]
                                }
                                min={0}
                                value={row[d]}
                                onChange={(e) =>
                                  updateEntry(
                                    row,
                                    d,
                                    Math.max(0, Number(e.target.value))
                                  )
                                }
                                className="w-14 bg-[var(--card)] text-[var(--text)] border border-[var(--border)] rounded p-1 text-center mr-2"
                              />
                            </div>
                          </td>
                        ))}

                        {canSeeBillable && (
                          <td className="w-auto p-2 text-center">
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

                        <td className="w-auto p-2 text-left">
                          {isSpecial ? (
                            <input
                              type="text"
                              disabled
                              className="border border-[var(--border)] rounded p-1 w-full"
                              defaultValue={row.description || ""}
                              onBlur={(e) =>
                                saveDescription(row, e.target.value)
                              }
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {week.entries.length > 0 ? (
                  <tfoot>
                    <tr className="font-semibold border-t">
                      <td className="w-auto p-2">Total</td>

                      {days.map((d) => (
                        <td key={d} className="w-auto p-0 text-left">
                          <input
                            type="number"
                            disabled
                            className="w-14 border border-[var(--border)] rounded p-1 text-center"
                            value={totals ? totals[d] : 0}
                          />
                        </td>
                      ))}

                      <td className="w-[50px] p-2 text-center px-2">
                        {canSeeBillable && "-"}
                      </td>

                      <td className="w-auto p-2 text-left">{weeklyTotal}</td>
                    </tr>
                  </tfoot>
                ) : (
                  <tbody>
                    <tr>
                      <td
                        colSpan={10}
                        className="p-4 text-sm text-center text-gray-500"
                      >
                        No Timesheet Data
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>

              {isCurrentWeek && week.entries.length > 0 && (
                <div className="flex justify-end p-2 mt-2 gap-2">
                  <button
                    onClick={handleSave}
                    disabled={week.status !== "DRAFT"}
                    className="px-4 py-2 rounded border border-[#2f4f82] disabled:bg-gray-400 disabled:text-white disabled:border-0"
                  >
                    Save
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={week.status !== "DRAFT"}
                    className="px-4 py-2 bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a] rounded disabled:bg-gray-400"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
