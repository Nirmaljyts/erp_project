import { useEffect, useState } from "react";
import { Edit2, Trash2, Users, X } from "lucide-react";
import Swal from "sweetalert2";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  assignUsers,
  getManagers,
  getEmployees,
} from "../services/projectServices";
import Pagination from "../components/Pagination";

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
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const [loading, setLoading] = useState(true);

  // Select lists
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  // Create/Edit modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProject, setAssignProject] = useState<Project | null>(null);

  // Shared assignment state (used in both modals)
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [assignedEmployees, setAssignedEmployees] = useState<number[]>([]);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");

  // ---------------- FETCH PROJECTS ----------------
  async function loadProjects(page = 1) {
    try {
      setLoading(true);
      const res = await getProjects(page, 10, "", "name", "asc");

      setProjects(res.data);
      setPagination({
        page: res.pagination.page,
        totalPages: res.pagination.totalPages,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects(1);
  }, []);

  const badgeStyles: Record<string, string> = {
    COMPLETED: "bg-blue-100 text-blue-600",
    ACTIVE: "bg-green-100 text-green-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    ON_HOLD: "bg-orange-100 text-orange-600",
    CANCELLED: "bg-red-100 text-red-700",
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
      await loadProjects(pagination.page);
    }
  }

  // ---------------- OPEN MODALS ----------------
  const openCreate = async () => {
    setEditingProject(null);

    setFormName("");
    setFormDescription("");
    setFormStatus("ACTIVE");
    setAssignedEmployees([]);
    setSelectedManager(null);

    // Load managers + free employees
    const [mgr, emp] = await Promise.all([
      getManagers(),
      getEmployees(), // no projectId -> only globally free employees
    ]);

    setManagers(mgr);
    setEmployees(emp);

    // auto-select first manager if available
    setSelectedManager(mgr.length ? mgr[0].id : null);

    setShowProjectModal(true);
  };

  const openEdit = async (p: Project) => {
    setEditingProject(p);

    setFormName(p.name);
    setFormDescription(p.description || "");
    setFormStatus(p.status);

    // Load managers + employees that are free OR already assigned to this project
    const [mgr, emp] = await Promise.all([getManagers(), getEmployees(p.id)]);

    setManagers(mgr);
    setEmployees(emp);

    // Pre-select stored manager (fallback to first manager if somehow null)
    setSelectedManager(p.manager?.id || (mgr.length ? mgr[0].id : null));

    // Keep currently assigned employees checked
    setAssignedEmployees(p.employees.map((e) => e.employee.id));

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
  };

  // ---------------- PAGINATION ----------------
  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadProjects(page);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="max-h-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold">Projects</h1>

        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
        >
          Create Project
        </button>
      </div>

      {loading ? (
        <div v-if="isProcessing" className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-4"
              >
                <div className="flex justify-between mb-3 gap-2">
                  <h2 className="text-lg font-semibold truncate">{p.name}</h2>
                  <div className="flex items-center gap-2">
                    <Users
                      size={18}
                      className="cursor-pointer text-[#2f4f82] hover:text-[#1b335a]"
                      onClick={() => openAssign(p)}
                    />
                    <Edit2
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => openEdit(p)}
                    />
                    <Trash2
                      size={18}
                      className="cursor-pointer text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteProject(p.id)}
                    />
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {p.description || "No description provided."}
                </p>

                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 ${
                    badgeStyles[p.status]
                  }`}
                >
                  {p.status}
                </span>

                <p>
                  <strong>Manager:</strong> {p.manager?.name || "—"}
                </p>

                <p>
                  <strong>Employees:</strong>{" "}
                  {p.employees.map((e) => e.employee.name).join(", ") || "—"}
                </p>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No projects found
            </div>
          )}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => handlePaginate(p)}
          />
        </>
      )}

      {/* ------------ CREATE / EDIT MODAL ------------ */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative">
            <button
              onClick={() => setShowProjectModal(false)}
              className="absolute right-4 top-4"
            >
              <X size={22} className="text-[var(--text)]" />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              {editingProject ? "Edit Project" : "Create Project"}
            </h2>

            {/* FORM INPUTS */}
            <div className="space-y-4">
              {/* Project Name */}
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Project Name"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              {/* Description */}
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              {/* Status */}
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Manager */}
              <div>
                <h3 className="font-semibold mb-2 text-[var(--text)]">
                  Select Manager
                </h3>

                <select
                  value={selectedManager ?? ""}
                  onChange={(e) =>
                    setSelectedManager(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
                >
                  <option value="">-- Select Manager --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employees */}
              <div>
                <h3 className="font-semibold mb-2 text-[var(--text)]">
                  Select Employees
                </h3>

                <div className="border border-[var(--border)] bg-[var(--card)] p-3 rounded-xl max-h-40 overflow-y-auto space-y-2">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex gap-3 items-center text-[var(--text)]"
                    >
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
                  ))}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={async () => {
                if (!selectedManager) {
                  alert("Manager is required");
                  return;
                }

                if (editingProject) {
                  await updateProject(editingProject.id, {
                    name: formName,
                    description: formDescription,
                    status: formStatus,
                    managerId: selectedManager,
                    employees: assignedEmployees,
                  });
                } else {
                  await createProject({
                    name: formName,
                    description: formDescription,
                    status: formStatus,
                    managerId: selectedManager,
                    employees: assignedEmployees,
                  });
                }

                setShowProjectModal(false);
                loadProjects(pagination.page);
              }}
              className="mt-6 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              {editingProject ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* ------------ ASSIGN MODAL ------------ */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute right-4 top-4"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-semibold mb-6">
              Assign Manager & Employees
            </h2>

            {/* Manager */}
            <h3 className="font-semibold mb-2">Select Manager (Required)</h3>
            <div className="border p-3 rounded-xl mb-6 space-y-2">
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

            {/* Employees */}
            <h3 className="font-semibold mb-2">Select Employees</h3>
            <div className="border p-3 rounded-xl max-h-40 overflow-y-auto space-y-2">
              {employees.map((emp) => (
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
              ))}
            </div>

            <button
              onClick={async () => {
                if (!selectedManager) {
                  alert("Manager is required");
                  return;
                }

                if (assignProject) {
                  await assignUsers(assignProject.id, {
                    managerId: selectedManager,
                    employees: assignedEmployees,
                  });
                }

                setShowAssignModal(false);
                loadProjects(pagination.page);
              }}
              className="mt-6 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              Save Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
