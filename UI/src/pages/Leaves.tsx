import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Calendar, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getMyLeaves, applyLeave, cancelLeave } from "../services/leaveService";
import Pagination from "../components/Pagination";

export default function Leaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    type: "ANNUAL",
    dayType: "FULL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  async function loadLeaves(page = 1) {
    const limit = 12;
    try {
      setLoading(true);
      const res = await getMyLeaves(page, limit);

      setLeaves(res.data.data);
      setPagination({
        page: res.data.pagination.page,
        totalPages: res.data.pagination.totalPages,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaves(pagination.page);
  }, []);

  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadLeaves(page);
    }
  };

  const createLeaveRequest = () => {
    setForm({
      type: "ANNUAL",
      dayType: "FULL",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error("Start and End date required");
      return;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error("End date cannot be before Start date");
      return;
    }

    try {
      setLoading(true);
      await applyLeave(form);
      toast.success("Leave request submitted");
      setShowModal(false);
      setLoading(false);
      window.dispatchEvent(new Event("notifications-updated"));
      loadLeaves(pagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply leave");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelLeave(id);
      toast.success("Leave request cancelled");
      window.dispatchEvent(new Event("notifications-updated"));
      loadLeaves(pagination.page);
    } catch {
      toast.error("Unable to cancel leave");
    }
  };

  return (
    <div className="max-h-auto">
      <div className="flex justify-between mb-2">
        <h1 className="text-2xl font-semibold">My Leaves</h1>

        <button
          onClick={createLeaveRequest}
          className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white hover:bg-[#1b335a] flex items-center gap-2"
        >
          Apply Leave
        </button>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {leaves.map((l: any) => (
              <div
                key={l.id}
                className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between">
                  <span className="font-semibold uppercase">
                    {l.type} - {l.dayType === "HALF" ? "Half Day" : "Full Day"}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      (
                        {
                          PENDING: "bg-yellow-100 text-yellow-700",
                          APPROVED: "bg-green-100 text-green-700",
                          REJECTED: "bg-red-100 text-red-700",
                          CANCELLED: "bg-gray-200 text-gray-600",
                        } as Record<string, string>
                      )[l.status]
                    }`}
                  >
                    {l.status}
                  </span>
                </div>

                <div className="mt-0 text-sm flex items-center">
                  <Calendar size={14} className="inline-block mr-1" />
                  {new Date(l.startDate).toLocaleDateString()} -{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>

                <p className="text-sm text-[var(--text)] mt-0">
                  {l.reason || "Reason Not Specified"}
                </p>

                {l.status === "APPROVED" && l.approvedBy && (
                  <p className="text-sm text-[var(--text)] mt-1 font-semibold">
                    Approved by:{" "}
                    <span className="font-normal">{l.approvedBy.name} on </span>
                    <span className="font-normal">
                      {l.decidedAt
                        ? new Date(l.decidedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </p>
                )}

                {l.status === "REJECTED" && l.rejectedBy && (
                  <p className="text-sm text-[var(--text)] mt-1 font-semibold">
                    Rejected by:{" "}
                    <span className="font-normal">{l.rejectedBy.name} on </span>
                    <span className="font-normal">
                      {l.decidedAt
                        ? new Date(l.decidedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </p>
                )}

                <p className="text-sm text-[var(--text)] mt-1 font-semibold">
                  Applied On:{" "}
                  <span className="font-normal">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                </p>

                {l.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(l.id)}
                    className="mt-2 px-3 py-[2px] rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => handlePaginate(p)}
          />

          {leaves.length === 0 && (
            <div className="h-max-full text-center w-full text-gray-500 py-10">
              No leaves
            </div>
          )}

          {/* LEAVE CREATE/EDIT MODAL */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative">
                <div className="flex justify-between mb-4">
                  <h2 className="font-semibold text-lg">Apply Leave</h2>
                  <X
                    size={20}
                    className="cursor-pointer"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <select
                    className="border border-[var(--border)] p-2 rounded bg-[var(--card)] text-[var(--text)]"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="ANNUAL">Annual</option>
                    <option value="CASUAL">Casual</option>
                    <option value="SICK">Sick</option>
                    <option value="UNPAID">LOP (Loss of Pay)</option>
                    <option value="WFH">WFH (Work From Home)</option>
                    <option value="OTHER">Other</option>
                  </select>

                  {["CASUAL", "SICK"].includes(form.type) && (
                    <select
                      className="border border-[var(--border)] p-2 rounded bg-[var(--card)] text-[var(--text)]"
                      value={form.dayType}
                      onChange={(e) =>
                        setForm({ ...form, dayType: e.target.value })
                      }
                    >
                      <option value="FULL">Full Day</option>
                      <option value="HALF">Half Day</option>
                    </select>
                  )}

                  <DatePicker
                    selected={form.startDate ? new Date(form.startDate) : null}
                    onChange={(date) =>
                      setForm({
                        ...form,
                        startDate: date ? date.toISOString().split("T")[0] : "",
                        endDate:
                          form.dayType === "HALF"
                            ? date
                              ? date.toISOString().split("T")[0]
                              : ""
                            : form.endDate,
                      })
                    }
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    placeholderText="Select start date"
                    className="border border-[var(--border)] p-2 rounded bg-[var(--card)] text-[var(--text)] w-full"
                  />

                  <DatePicker
                    selected={form.endDate ? new Date(form.endDate) : null}
                    onChange={(date) =>
                      setForm({
                        ...form,
                        endDate: date ? date.toISOString().split("T")[0] : "",
                      })
                    }
                    disabled={form.dayType === "HALF"}
                    dateFormat="dd/MM/yyyy"
                    minDate={
                      form.startDate ? new Date(form.startDate) : new Date()
                    }
                    placeholderText="Select end date"
                    className="border border-[var(--border)] p-2 rounded bg-[var(--card)] text-[var(--text)] w-full"
                  />

                  <textarea
                    className="border border-[var(--border)] p-2 rounded bg-[var(--card)] text-[var(--text)]"
                    placeholder="Reason (optional)"
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  />

                  <button
                    onClick={handleSubmit}
                    className="w-full bg-[#2f4f82] text-white py-2 rounded-lg hover:bg-[#1b335a]"
                  >
                    Submit Leave
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
