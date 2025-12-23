import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getPendingLeaves,
  approveLeave,
  rejectLeave,
} from "../services/leaveService";
import Pagination from "../components/Pagination";
import EmptyStateComponent from "../components/EmptyStateComponent";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  async function loadData(page = 1) {
    const limit = 9;
    try {
      setLoading(true);
      const res = await getPendingLeaves(page, limit);
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
    loadData(pagination.page);
  }, []);

  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadData(page);
    }
  };

  const handleAction = async (id: number, action: "APPROVE" | "REJECT") => {
    try {
      if (action === "APPROVE") {
        setLoading(true);
        await approveLeave(id);
        setLoading(false);
        window.dispatchEvent(new Event("notifications-updated"));
        toast.success("Leave approved");
      } else {
        setLoading(true);
        await rejectLeave(id);
        setLoading(false);
        window.dispatchEvent(new Event("notifications-updated"));
        toast.error("Leave rejected");
      }
      loadData(pagination.page);
    } catch {
      toast.error("Failed to update leave");
    }
  };

  return (
    <div className="max-h-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <h1 className="text-2xl font-semibold">Leave Approvals</h1>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="w-full grid mb-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {leaves.map((l: any) => (
              <div
                key={l.id}
                className="border border-[var(--border)] p-4 rounded-xl bg-[var(--card)] shadow-sm"
              >
                <div className="font-semibold">{l.user?.name}</div>

                <div className="text-sm text-gray-500 uppercase">
                  {l.type} - {l.dayType === "HALF" ? "Half Day" : "Full Day"}
                </div>

                <div className="mt-2 text-sm">
                  {new Date(l.startDate).toLocaleDateString()} -{" "}
                  {new Date(l.endDate).toLocaleDateString()}
                </div>

                <p className="text-gray-600 text-sm mt-1">
                  {l.reason || "Reason Not Specified"}
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  Applied On:{" "}
                  <span className="font-semibold">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                </p>

                {l.status === "APPROVED" && l.approvedBy && (
                  <p className="mt-1 text-sm text-green-600">
                    Approved by:{" "}
                    <span className="font-semibold">{l.approvedBy.name}</span>
                  </p>
                )}

                {l.status === "REJECTED" && l.rejectedBy && (
                  <p className="mt-1 text-sm text-red-600">
                    Rejected by:{" "}
                    <span className="font-semibold">{l.rejectedBy.name}</span>
                  </p>
                )}

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

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => handlePaginate(p)}
          />

          {leaves.length === 0 && <EmptyStateComponent name="Approved Leave" />}
        </>
      )}
    </div>
  );
}
