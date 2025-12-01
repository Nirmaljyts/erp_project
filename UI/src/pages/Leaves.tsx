import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Calendar, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getMyLeaves, applyLeave, cancelLeave } from "../services/leaveService";

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "ANNUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });

  async function loadLeaves() {
    try {
      setLoading(true);
      const res = await getMyLeaves();
      setLeaves(res.data);
    } finally {
      setLoading(false);
    }
  }

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
      await applyLeave(form);
      toast.success("Leave request submitted");
      setShowModal(false);
      loadLeaves();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply leave");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelLeave(id);
      toast.success("Leave request cancelled");
      loadLeaves();
    } catch {
      toast.error("Unable to cancel leave");
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  return (
    <div className="max-h-auto">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Leaves</h1>

        <button
          onClick={() => setShowModal(true)}
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
          {/* LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {leaves.map((l: any) => (
              <div
                key={l.id}
                className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">{l.type}</span>
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

                <div className="mt-2 text-sm">
                  <Calendar size={14} className="inline-block mr-1" />
                  {new Date(l.startDate).toLocaleDateString()} -{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>

                <p className="text-sm text-gray-500 mt-1">{l.reason || "-"}</p>

                {/* APPROVED BY / REJECTED BY */}
                {l.status === "APPROVED" && l.approvedBy && (
                  <p className="text-sm text-gray-600 mt-2">
                    Approved by:{" "}
                    <span className="font-semibold">{l.approvedBy.name}</span>
                  </p>
                )}

                {l.status === "REJECTED" && l.rejectedBy && (
                  <p className="text-sm mt-2">
                    Rejected by:{" "}
                    <span className="font-semibold">{l.rejectedBy.name}</span>
                  </p>
                )}

                {/* CANCEL BUTTON */}
                {l.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(l.id)}
                    className="mt-3 px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* MODAL */}
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
                    <option value="SICK">Sick</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="WFH">Work From Home</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <DatePicker
                    selected={form.startDate ? new Date(form.startDate) : null}
                    onChange={(date) =>
                      setForm({
                        ...form,
                        startDate: date ? date.toISOString().split("T")[0] : "",
                        endDate:
                          form.endDate && date && new Date(form.endDate) < date
                            ? ""
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
                    className="w-full mt-2 bg-[#2f4f82] text-white py-2 rounded-lg hover:bg-[#1b335a]"
                  >
                    Submit Leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {leaves.length === 0 && (
            <div className="h-max-full text-center w-full text-gray-500 py-10">
              No leaves
            </div>
          )}
        </>
      )}
    </div>
  );
}
