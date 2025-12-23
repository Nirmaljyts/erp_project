import { useEffect, useState } from "react";
import { Edit2, Trash2, Users, X } from "lucide-react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  assignUsers,
  getManagers,
  getEmployees,
  removeEmployee,
} from "../services/projectServices";
import Pagination from "../components/Pagination";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Tooltip from "../components/Tooltip";
import EmptyStateComponent from "../components/EmptyStateComponent";

interface Manager {
  id: number;
  name: string;
}

interface SimpleEmployee {
  id: number;
  name: string;
}

interface EmployeeItem {
  employee: { id: number; name: string };
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  manager?: Manager | null;
  employees: EmployeeItem[];
  startDate?: any;
  endDate?: any;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProject, setAssignProject] = useState<Project | null>(null);

  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [assignedEmployees, setAssignedEmployees] = useState<number[]>([]);

  const [originalEmployees, setOriginalEmployees] = useState<number[]>([]);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formStartDate, setFormStartDate] = useState<Date | null>(null);
  const [formEndDate, setFormEndDate] = useState<Date | null>(null);

  const [nameError, setNameError] = useState("");
  const [managerError, setManagerError] = useState("");
  const [dateError, setDateError] = useState("");

  const user = useSelector((state: RootState) => state?.auth?.user);

  async function loadProjects(page = 1, searchValue = search) {
    const limit = 12;
    try {
      setLoading(true);
      const res = await getProjects(page, limit, searchValue, "status", "asc");

      setProjects(res.data);
      setPagination({
        page: res.pagination.page,
        totalPages: res.pagination.totalPages,
      });
    } finally {
      setLoading(false);
    }
  }

  const onSearch = (value: any) => {
    setSearch(value);
    loadProjects(1, value);
  };

  useEffect(() => {
    loadProjects(1, search);
  }, []);

  const badgeStyles: Record<string, string> = {
    COMPLETED: "border border-blue-700 text-blue-600",
    ACTIVE: "border border-green-700 text-green-600",
    ON_HOLD: "border border-orange-700 text-orange-600",
    CANCELLED: "border border-red-700 text-red-600",
  };

  async function handleDeleteProject(id: number) {
    const result = await Swal.fire({
      title: "Delete Project?",
      text: "This action cannot be reversed.",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonColor: "#1b335a",
    });

    if (result.isConfirmed) {
      await deleteProject(id);
      await loadProjects(pagination.page, search);
      toast.success("Project deleted");
    }
  }

  const openCreate = async () => {
    setEditingProject(null);

    setFormName("");
    setFormDescription("");
    setFormStatus("ACTIVE");
    setAssignedEmployees([]);
    setSelectedManager(null);

    const [mgr, emp] = await Promise.all([getManagers(), getEmployees()]);

    setManagers(mgr);
    setEmployees(emp);

    // auto-select first manager if available
    // setSelectedManager(mgr.length ? mgr[0].id : null);

    setShowProjectModal(true);
  };

  const openEdit = async (p: Project) => {
    setEditingProject(p);

    setFormName(p.name);
    setFormDescription(p.description || "");
    setFormStatus(p.status);
    setFormStartDate(p.startDate ? new Date(p.startDate) : null);
    setFormEndDate(p.endDate ? new Date(p.endDate) : null);

    const [mgr, emp] = await Promise.all([getManagers(), getEmployees(p.id)]);

    setManagers(mgr);
    setEmployees(emp);

    setSelectedManager(p.manager?.id ?? (mgr.length > 0 ? mgr[0].id : null));

    const assigned = Array.isArray(p.employees)
      ? p.employees.map((x) => x.employee?.id).filter(Boolean)
      : [];

    setOriginalEmployees(assigned);
    setAssignedEmployees(assigned);
    setShowProjectModal(true);
  };

  const openAssign = async (p: Project) => {
    const [mgr, emp] = await Promise.all([getManagers(), getEmployees(p.id)]);

    setManagers(mgr);
    setEmployees(emp);

    setAssignProject(p);
    setSelectedManager(p.manager?.id || (mgr.length ? mgr[0].id : null));
    setAssignedEmployees(p.employees.map((e) => e.employee.id));

    setShowAssignModal(true);

    const originalEmployees = p.employees.map((e) => e.employee.id);
    setOriginalEmployees(originalEmployees);
  };

  const projectAssign = async () => {
    try {
      if (!assignProject) return;

      // detect removed employees
      const removed = originalEmployees.filter(
        (id) => !assignedEmployees.includes(id)
      );

      // call remove API for each removed employee
      for (const empId of removed) {
        await removeEmployee(assignProject.id, empId);
      }

      // update manager + add new employees
      await assignUsers(assignProject.id, {
        managerId: selectedManager,
        employees: assignedEmployees,
      });

      toast.success("User assignment updated");
      setShowAssignModal(false);
      loadProjects(pagination.page, search);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to assign users";

      Swal.fire({
        icon: "error",
        title: "Assignment Error",
        text: message,
        confirmButtonColor: "#d33",
      });
    }
  };

  async function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;

    const cleanName = formName.trim();
    const cleanManager = selectedManager;

    if (!cleanName) {
      setNameError("Project name is required");
      valid = false;
    } else if (cleanName.length < 3) {
      setNameError("Project name must be at least 3 characters");
      valid = false;
    } else {
      setNameError("");
    }

    if (!formStartDate || !formEndDate) {
      setDateError("Select both start and end dates");
      return;
    } else if (formStartDate.getTime() === formEndDate.getTime()) {
      setDateError("Start and End date cannot be the same");
      return;
    } else if (formEndDate <= formStartDate) {
      setDateError("End date must be greater than Start date");
      return;
    } else {
      setDateError("");
    }

    if (!cleanManager) {
      setManagerError("Manager is required");
      valid = false;
    } else {
      setManagerError("");
    }

    if (!valid) return;

    const payload = {
      name: cleanName,
      description: formDescription.trim(),
      status: formStatus,
      managerId: cleanManager,
      employees: assignedEmployees,
      startDate: formStartDate.toISOString(),
      endDate: formEndDate.toISOString(),
    };

    try {
      if (editingProject) {
        const removed = originalEmployees.filter(
          (id) => !assignedEmployees.includes(id)
        );

        for (const empId of removed) {
          await removeEmployee(editingProject.id, empId);
        }

        await updateProject(editingProject.id, payload);
        toast.success("Project updated");
      } else {
        await createProject(payload);
        toast.success("Project created");
      }

      closeProjectModal();
      loadProjects(pagination.page, search);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Employee conflict detected";

      Swal.fire({
        icon: "error",
        title: "Assignment Error",
        text: message,
        confirmButtonColor: "#d33",
      });
    }
  }

  const closeProjectModal = () => {
    setNameError("");
    setManagerError("");
    setShowProjectModal(false);
    setFormStartDate(null);
    setFormEndDate(null);
  };

  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadProjects(page, search);
    }
  };

  return (
    <div className="max-h-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
        <h1 className="text-2xl font-semibold">Projects</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72 md:w-64 lg:w-80">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => {
                let value = e.target.value.trimStart();

                // Remove leading/trailing spaces
                value = value.trimStart();

                // Replace multiple spaces with a single space
                value = value.replace(/\s+/g, " ");

                setSearch(value);
                onSearch(value);
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (/^\s*$/.test(pasted)) {
                  e.preventDefault();
                }
              }}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] 
                 focus:outline-none focus:ring-2 focus:ring-[#2f4f82]"
            />

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  onSearch("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-500"
              >
                <X size={18} className="cursor-pointer" />
              </button>
            )}
          </div>

          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              Create Project
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div v-if="isProcessing" className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-4"
              >
                <div className="flex justify-between mb-1 gap-2">
                  <h2 className="text-lg font-semibold truncate">{p.name}</h2>
                  {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
                    <div className="flex items-center gap-2">
                      <Tooltip text="Assign Employees" position="bottom">
                        <Users
                          size={18}
                          className="cursor-pointer text-[#2f4f82] hover:text-[#1b335a]"
                          onClick={() => openAssign(p)}
                        />
                      </Tooltip>

                      <Tooltip text="Edit Employees" position="bottom">
                        <Edit2
                          size={18}
                          className="cursor-pointer text-gray-500 hover:text-gray-700"
                          onClick={() => openEdit(p)}
                        />
                      </Tooltip>

                      {user?.role === "ADMIN" && (
                        <Tooltip text="Delete Employees" position="bottom">
                          <Trash2
                            size={18}
                            className="cursor-pointer text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteProject(p.id)}
                          />
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-gray-800 dark:text-gray-500 truncate">
                  {p.description || "No description provided."}
                </p>

                <span
                  className={`inline-block px-2 py-[3px] text-xs font-semibold rounded-full my-1 ${
                    badgeStyles[p.status]
                  }`}
                >
                  {p.status}
                </span>

                <div>
                  <span className="text-xs text-gray-500">
                    {p.startDate
                      ? new Date(p.startDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                    {" - "}
                    {p.endDate
                      ? new Date(p.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "numeric",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">Manager:</p>{" "}
                  <p className="text-sm text-gray-500 truncate">
                    {p.manager?.name || "Not Assigned"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <p className="font-semibold text-sm">Employees:</p>{" "}
                  <p className="text-sm text-gray-500 truncate">
                    {p.employees.map((e) => e.employee.name).join(", ") ||
                      "Not Assigned"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && <EmptyStateComponent name="Project" />}

          <div className="fixed bottom-0 left-0 right-0 shadow-md p-3 z-50">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => handlePaginate(p)}
            />
          </div>
        </>
      )}

      {/* ------------ PROJECT CREATE/EDIT MODAL ------------ */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleProjectSubmit}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative"
          >
            <button
              type="button"
              onClick={closeProjectModal}
              className="absolute right-4 top-4 cursor-pointer"
            >
              <Tooltip text="Close" position="left">
                <X size={22} className="text-[var(--text)] cursor-pointer" />
              </Tooltip>
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[var(--text)]">
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>

            <div className="space-y-2">
              <input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="Project Name"
                className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                  nameError ? "border-red-500" : "border-[var(--border)]"
                }`}
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}

              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              <div className="flex items-center gap-4 m-0">
                <DatePicker
                  selected={formStartDate}
                  onChange={(date: Date | null) => {
                    setFormStartDate(date);
                    if (dateError) setDateError("");
                  }}
                  className="w-full p-2 border border-[var(--border)] cursor-pointer rounded-lg bg-[var(--card)] text-[var(--text)]"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Start Date"
                />
                <span>~</span>
                <DatePicker
                  selected={formEndDate}
                  onChange={(date: Date | null) => {
                    setFormEndDate(date);
                    if (dateError) setDateError("");
                  }}
                  className="w-full p-2 border border-[var(--border)] cursor-pointer rounded-lg bg-[var(--card)] text-[var(--text)]"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="End Date"
                  minDate={formStartDate || undefined}
                />
              </div>

              {dateError && <p className="text-red-500 text-sm">{dateError}</p>}

              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <div>
                <select
                  value={selectedManager ?? ""}
                  onChange={(e) => {
                    setSelectedManager(
                      e.target.value ? Number(e.target.value) : null
                    );
                    if (managerError) setManagerError("");
                  }}
                  className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                    managerError ? "border-red-500" : "border-[var(--border)]"
                  }`}
                >
                  <option value="">-- Select Manager --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {managerError && (
                  <p className="text-red-500 text-sm">{managerError}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-[var(--text)]">
                  Select Employees
                </h3>
                <div className="border border-[var(--border)] bg-[var(--card)] p-3 rounded-xl max-h-40 overflow-y-auto space-y-1">
                  {employees.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      No Employees Available
                    </p>
                  ) : (
                    employees.map((emp) => (
                      <label key={emp.id} className="flex gap-3 items-center">
                        <input
                          type="checkbox"
                          checked={assignedEmployees.includes(emp.id)}
                          onChange={() =>
                            setAssignedEmployees((prev) =>
                              prev.includes(emp.id)
                                ? prev.filter((x) => x !== emp.id)
                                : [...prev, emp.id]
                            )
                          }
                        />
                        {emp.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              {editingProject ? "Update" : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* ------------ USER ASSIGN MODAL ------------ */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute right-4 top-4"
            >
              <Tooltip text="Close" position="left">
                <X size={22} className="text-[var(--text)] cursor-pointer" />
              </Tooltip>
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Assign Manager & Employees
            </h2>

            <h3 className="font-semibold mb-2">Select Manager (Required)</h3>
            <div className="border p-3 rounded-xl mb-2 space-y-2">
              {managers.map((m) => (
                <label key={m.id} className="flex gap-3 items-center">
                  <input
                    type="radio"
                    checked={selectedManager === m.id}
                    onChange={() => setSelectedManager(m.id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>

            <h3 className="font-semibold mb-2">Select Employees</h3>
            <div className="border p-3 rounded-xl max-h-40 overflow-y-auto space-y-2">
              {employees.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  No Employees Available
                </p>
              ) : (
                employees.map((emp) => (
                  <label key={emp.id} className="flex gap-3 items-center">
                    <input
                      type="checkbox"
                      checked={assignedEmployees.includes(emp.id)}
                      onChange={() =>
                        setAssignedEmployees((prev) =>
                          prev.includes(emp.id)
                            ? prev.filter((x) => x !== emp.id)
                            : [...prev, emp.id]
                        )
                      }
                    />
                    {emp.name}
                  </label>
                ))
              )}
            </div>

            <button
              onClick={projectAssign}
              className="mt-2 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              Update Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
