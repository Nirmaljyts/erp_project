import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getPendingLeaves,
  approveLeave,
  rejectLeave,
} from "../services/leaveService";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await getPendingLeaves();
      setLeaves(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: number, action: "APPROVE" | "REJECT") => {
    try {
      if (action === "APPROVE") {
        await approveLeave(id);
        toast.success("Leave approved");
      } else {
        await rejectLeave(id);
        toast.error("Leave rejected");
      }
      loadData();
    } catch {
      toast.error("Failed to update leave");
    }
  };

  return (
    <div className="max-h-auto">
      <h1 className="text-2xl font-semibold mb-4">Leave Approvals</h1>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {leaves.map((l: any) => (
              <div
                key={l.id}
                className="border border-[var(--border)] p-4 rounded-xl bg-[var(--card)] shadow-sm"
              >
                <div className="font-semibold">{l.user?.name}</div>
                <div className="text-sm text-gray-500">{l.type}</div>

                <div className="mt-2 text-sm">
                  {new Date(l.startDate).toLocaleDateString()} -{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>

                <p className="text-gray-600 text-sm mt-1">{l.reason || "-"}</p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAction(l.id, "REJECT")}
                    className="flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleAction(l.id, "APPROVE")}
                    className="flex-1 bg-[#2f4f82] text-white font-medium py-1 rounded hover:bg-[#1b335a]"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>

          {leaves.length === 0 && (
            <div className="h-max-full text-center w-full text-gray-500 py-10">
              No leaves to approve
            </div>
          )}
        </>
      )}
    </div>
  );
}
