import { useEffect, useState } from "react";
import {
  getDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
} from "../services/timesheetServices";
import { getProjects } from "../services/projectServices";
import { toast } from "react-toastify";
import Tooltip from "../components/Tooltip";
import { Edit2, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";

export default function TimesheetDefinitions() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    type: "",
    projectId: "",
    description: "",
    appliesTo: "",
  });

  useEffect(() => {
    loadDefinitions();
    loadProjects();
  }, []);

  async function loadDefinitions() {
    try {
      setLoading(true);
      const res = await getDefinitions();
      setDefinitions(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const res = await getProjects(1, 1000, "", "status", "asc");
      setProjects(res.data.data || res.data);
    } catch {
      toast.error("Failed to load projects");
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({
      type: "",
      projectId: "",
      description: "",
      appliesTo: "",
    });
    setModalOpen(true);
  }

  function openEditModal(def: any) {
    setEditing(def);
    setForm({
      type: def.type,
      projectId: def.projectId || "",
      description: def.description || "",
      appliesTo: def.appliesTo,
    });
    setModalOpen(true);
  }

  function closeDefinitionModal() {
    setModalOpen(false);
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!form.type) newErrors.type = "Type is required";

    if (form.type === "PROJECT") {
      if (!form.projectId) {
        newErrors.projectId = "Project is required";
      }
    }

    if (form.type === "SPECIAL") {
      if (!form.description.trim()) {
        newErrors.description = "Description is required";
      }

      if (!form.appliesTo) {
        newErrors.appliesTo = "Applies To is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSaveDefinition(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload: any = {
        type: form.type,
        appliesTo: form.appliesTo,
        projectId: null,
        description: null,
      };

      if (form.type === "PROJECT") {
        payload.projectId = Number(form.projectId);
      }

      if (form.type === "SPECIAL") {
        payload.description = form.description.trim();
      }

      if (editing) {
        await updateDefinition(editing.id, payload);
        toast.success("Definition updated");
      } else {
        await createDefinition(payload);
        toast.success("Definition created");
      }

      setModalOpen(false);
      setErrors({});
      loadDefinitions();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  }

  const fieldClass = (name: string) =>
    `w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
      errors[name] ? "border-red-500" : "border-[var(--border)]"
    }`;

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Delete Definition?",
      text: "This action cannot be reversed.",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonColor: "#1b335a",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDefinition(id);
      toast.success("Deleted");
      loadDefinitions();
    } catch (e: any) {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="max-h-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Timesheet Definitions</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
        >
          Create Definition
        </button>
      </div>

      <div className="border border-[var(--border)] rounded-xl bg-[var(--card)]">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-xs uppercase font-bold text-left">
                Type
              </th>
              <th className="p-2 text-xs uppercase font-bold text-left">
                Project
              </th>
              <th className="p-2 text-xs uppercase font-bold text-left">
                Description
              </th>
              <th className="p-2 text-xs uppercase font-bold text-left">
                Applies To
              </th>
              <th className="p-2 text-xs uppercase font-bold text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {definitions.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-2 text-sm">{d.type}</td>
                <td className="p-2 text-sm">{d.project?.name || "-"}</td>
                <td className="p-2 text-sm">{d.description || "-"}</td>
                <td className="p-2 text-sm">{d.appliesTo}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(d)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Tooltip text="Edit Definition" position="left">
                        <Edit2 size={18} className="cursor-pointer" />
                      </Tooltip>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Tooltip text="Delete Definition" position="left">
                        <Trash2 size={18} className="cursor-pointer" />
                      </Tooltip>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {definitions.length === 0 && (
              <tr className="border-t">
                <td
                  colSpan={5}
                  className="p-4 text-sm text-center text-gray-500"
                >
                  No Definitions Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TIMESHEET DEFINITION ADD/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveDefinition}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative"
          >
            <button
              type="button"
              onClick={closeDefinitionModal}
              className="absolute right-4 top-4 cursor-pointer"
            >
              <Tooltip text="Close" position="left">
                <X size={22} className="text-[var(--text)] cursor-pointer" />
              </Tooltip>
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Definition" : "Create Definition"}
            </h2>

            <div className="space-y-2">
              <select
                value={form.type}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({
                    type: value,
                    projectId: "",
                    description: "",
                    appliesTo: "",
                  });
                  setErrors({});
                }}
                className={fieldClass("type")}
              >
                <option value="">-- Select Project Type --</option>
                <option value="PROJECT">Project-based</option>
                <option value="SPECIAL">Special Row</option>
              </select>

              {errors.type && (
                <p className="text-xs text-red-500 mt-1">{errors.type}</p>
              )}

              {form.type === "PROJECT" && (
                <>
                  <select
                    value={form.projectId}
                    onChange={(e) => {
                      setForm({ ...form, projectId: e.target.value });
                      setErrors({ ...errors, projectId: "" });
                    }}
                    className={fieldClass("projectId")}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {errors.projectId && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.projectId}
                    </p>
                  )}
                </>
              )}

              {form.type === "SPECIAL" && (
                <>
                  <input
                    type="text"
                    value={form.description}
                    placeholder="Description"
                    className={fieldClass("description")}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      setErrors({ ...errors, description: "" });
                    }}
                  />

                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description}
                    </p>
                  )}
                </>
              )}

              {form.type === "SPECIAL" && (
                <>
                  <select
                    value={form.appliesTo}
                    onChange={(e) => {
                      setForm({ ...form, appliesTo: e.target.value });
                      setErrors({ ...errors, appliesTo: "" });
                    }}
                    className={fieldClass("appliesTo")}
                  >
                    <option value="">-- Select User --</option>
                    <option value="ALL">ALL USERS</option>
                    <option value="EMPLOYEE">EMPLOYEES</option>
                    <option value="MANAGER">MANAGERS</option>
                    <option value="HR">HR</option>
                    <option value="HR_MANAGER">HR MANAGERS</option>
                  </select>

                  {errors.appliesTo && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.appliesTo}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="submit"
                className="mt-2 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
