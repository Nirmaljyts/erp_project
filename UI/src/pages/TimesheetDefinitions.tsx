import { useEffect, useState } from "react";
import {
  getDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
} from "../services/timesheetServices";
import { toast } from "react-toastify";
import Tooltip from "../components/Tooltip";
import { Edit2, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function TimesheetDefinitions() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    type: "PROJECT",
    projectId: "",
    description: "",
    appliesTo: "ALL",
  });

  useEffect(() => {
    loadDefinitions();
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

  function openCreateModal() {
    setEditing(null);
    setForm({
      type: "PROJECT",
      projectId: "",
      description: "",
      appliesTo: "ALL",
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

  async function handleSave() {
    try {
      // Build safe payload
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
        payload.description = form.description?.trim() || null;
      }

      if (editing) {
        await updateDefinition(editing.id, payload);
        toast.success("Definition updated");
      } else {
        await createDefinition(payload);
        toast.success("Definition created");
      }

      setModalOpen(false);
      loadDefinitions();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed");
    }
  }

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
          Add Definition
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-xs uppercase font-bold text-left">Type</th>
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
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No definitions found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[400px]">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Definition" : "Create Definition"}
            </h2>

            {/* TYPE */}
            <label className="block mb-2">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            >
              <option value="PROJECT">Project-based</option>
              <option value="SPECIAL">Special Row</option>
            </select>

            {/* PROJECT OR DESCRIPTION */}
            {form.type === "PROJECT" ? (
              <>
                <label className="block mb-2">Project ID</label>
                <input
                  type="number"
                  value={form.projectId}
                  className="w-full border p-2 rounded mb-3"
                  onChange={(e) =>
                    setForm({ ...form, projectId: e.target.value })
                  }
                />
              </>
            ) : (
              <>
                <label className="block mb-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  className="w-full border p-2 rounded mb-3"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </>
            )}

            {/* Applies To */}
            <label className="block mb-2">Applies To</label>
            <select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
              className="w-full border p-2 rounded mb-3"
            >
              <option value="ALL">ALL USERS</option>
              <option value="EMPLOYEE">EMPLOYEES</option>
              <option value="MANAGER">MANAGERS</option>
              <option value="HR">HR</option>
              <option value="HR_MANAGER">HR MANAGERS</option>
            </select>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
