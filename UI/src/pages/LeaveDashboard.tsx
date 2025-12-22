import { useEffect, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import {
  getLeaveDashboard,
  deleteApprovedLeave,
} from "../services/leaveService";
import { RootState } from "../store/store";
import Tooltip from "../components/Tooltip";
import { RingComponent } from "../components/RingComponent";
import Pagination from "../components/Pagination";

export default function LeaveDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const currentRole = user?.role || "";

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  type Stat = { status: string; _count: number };
  const [stats, setStats] = useState<Stat[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any>({});

  const navigate = useNavigate();

  async function loadDashboard(page = 1) {
    const limit = 10;
    try {
      setLoading(true);
      const res = await getLeaveDashboard(page, limit);
      setLeaves(res.data.leaves);
      setPagination({
        page: res.data.pagination.page,
        totalPages: res.data.pagination.totalPages,
      });
      setStats(res.data.stats);
      setLeaveBalances(res.data.leaveBalances);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(pagination.page);
  }, []);

  const navigateToLeaves = () => {
    navigate("/request-leaves");
  };

  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadDashboard(page);
    }
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

  async function handleDeleteApproved(id: any) {
    const confirm = await Swal.fire({
      title: "Delete Approved Leave?",
      text: "This approved leave is for a future date. Proceed?",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#1b335a",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      await deleteApprovedLeave(id);
      setLoading(false);
      window.dispatchEvent(new Event("notifications-updated"));
      toast.success("Deleted the approved leave.");

      loadDashboard(pagination.page);
    } catch (err: any) {
      Swal.fire({
        title: "Delete Approved Leave?",
        text: err?.response?.data?.message || "Failed to delete leave",
        icon: "error",
        reverseButtons: true,
        confirmButtonColor: "#1b335a",
      });
    }
  }

  return (
    <div className="max-h-auto">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">
        Leave Dashboard
      </h1>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
            <RingComponent
              label="Annual"
              taken={leaveBalances.ANNUAL?.taken ?? 0}
              total={leaveBalances.ANNUAL?.total ?? 0}
              linkTo="/request-leaves"
            />

            <RingComponent
              label="Casual"
              taken={leaveBalances.CASUAL?.taken ?? 0}
              total={leaveBalances.CASUAL?.total ?? 0}
              linkTo="/request-leaves"
            />

            <RingComponent
              label="Sick"
              taken={leaveBalances.SICK?.taken ?? 0}
              total={leaveBalances.SICK?.total ?? 0}
              linkTo="/request-leaves"
            />

            <RingComponent
              label="WFH"
              taken={leaveBalances.WFH?.taken ?? 0}
              total={leaveBalances.WFH?.total ?? 0}
              linkTo="/request-leaves"
            />

            <RingComponent
              label="LOP"
              taken={leaveBalances.UNPAID?.taken ?? 0}
              total={null}
              linkTo="/request-leaves"
            />
          </div>

          <div className="grid  sx:grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-2">
            {[
              "TOTAL",
              "APPROVED",
              "PENDING",
              "REJECTED",
              "CANCELLED",
            ].map((key) => {
              const count =
                key === "TOTAL"
                  ? leaves.length
                  : stats.find((s: any) => s.status === key)?._count || 0;

              return (
                <div
                  key={key}
                  className="p-3 sm:p-4 border border-[var(--border)] rounded-xl bg-[var(--card)] shadow-sm"
                >
                  <p className="text-xs text-left  sm:text-xs text-gray-500">
                    {key}
                  </p>
                  <p
                    className="cursor-pointer text-xl text-left sm:text-2xl font-bold hover:underline"
                    onClick={navigateToLeaves}
                  >
                    {count}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mb-2 sm:mb-2">
            <button
              onClick={leaveRequest}
              className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              Request Leave
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] p-2 sm:p-4 shadow-sm mb-4">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              headerToolbar={{
                left: "title",
                center: "",
                right: "today prev,next",
              }}
              buttonText={{
                today: "Today",
              }}
              height="100%"
              contentHeight="auto"
              expandRows={true}
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm w-full">
            <h2 className="text-lg font-semibold mb-2">All Leaves</h2>

            <div className="border border-[var(--border)] rounded-xl bg-[var(--card)]">
              <table className="table text-xs md:text-sm border-collapse">
                <thead className="t_head table_th">
                  <tr>
                    {[
                      "#",
                      "Name",
                      "Role",
                      "Leave Type",
                      "Period",
                      "Status",
                      "Actions",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-2 py-3 text-left text-[7px] sm:text-xs font-bold uppercase"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="">
                  {leaves.length === 0 ? (
                    <tr className="border-t">
                      <td
                        colSpan={7}
                        className="table_td px-2 py-6 text-center text-gray-500"
                      >
                        No Leave Data
                      </td>
                    </tr>
                  ) : (
                    leaves.map((l: any, index) => (
                      <tr
                        key={l.id}
                        className="border-t border-[var(--border)] px-2 py-3 text-left"
                        data-label="#"
                      >
                        <td
                          className="table_td text-[10px] sm:text-xs p-2"
                          data-label="Name"
                        >
                          {index + 1}
                        </td>

                        <td
                          className="table_td text-[10px] sm:text-xs p-2"
                          data-label="Name"
                        >
                          {l.user.name}
                        </td>

                        <td
                          className="table_td text-[10px] sm:text-xs p-2"
                          data-label="Role"
                        >
                          {l.user.role}
                        </td>

                        <td
                          className="table_td text-[10px] sm:text-xs p-2"
                          data-label="Leave Type"
                        >
                          {l.type}
                        </td>

                        <td
                          className="table_td text-[10px] sm:text-xs p-2"
                          data-label="Period"
                        >
                          {new Date(l.startDate).toLocaleDateString()} →{" "}
                          {new Date(l.endDate).toLocaleDateString()}
                        </td>

                        <td
                          className="table_td text-[10px] sm:text-xs p-2 font-semibold"
                          data-label="Status"
                        >
                          <span
                            style={{
                              color:
                                l.status === "APPROVED"
                                  ? "#16801d"
                                  : l.status === "PENDING"
                                  ? "#666967"
                                  : l.status === "REJECTED"
                                  ? "#bd4d4d"
                                  : "#a6b4bd",
                            }}
                          >
                            {l.status}
                          </span>

                          {l.status === "APPROVED" && l.approvedBy && (
                            <span className="ml-2 text-xs text-gray-600">
                              → {l.approvedBy.name}
                            </span>
                          )}

                          {l.status === "REJECTED" && l.rejectedBy && (
                            <span className="ml-2 text-xs text-red-600">
                              → {l.rejectedBy.name}
                            </span>
                          )}
                        </td>

                        <td className="table_td text-[10px] sm:text-xs">
                          {l.status === "APPROVED" &&
                            ["ADMIN", "HR_MANAGER", "HR", "MANAGER"].includes(
                              currentRole
                            ) && (
                              <button
                                onClick={() => handleDeleteApproved(l.id)}
                                className="ml-3 text-red-500 hover:text-red-700"
                              >
                                <Tooltip
                                  text="Delete Approved Leave"
                                  position="right"
                                >
                                  <Trash2
                                    size={18}
                                    className="cursor-pointer"
                                  />
                                </Tooltip>
                              </button>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => handlePaginate(p)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
