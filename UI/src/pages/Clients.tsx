import { useEffect, useState } from "react";
import { Edit2, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../services/clientServices";
import Pagination from "../components/Pagination";

interface Client {
  id: number;
  name: string;
  contactedBy?: string;
  email: string;
  phone: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formContactedBy, setFormContactedBy] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");

  // ---------------- FETCH CLIENTS ----------------
  async function loadClients(page = 1) {
    try {
      setLoading(true);

      const res = await getClients(page);
      setClients(res.data);

      setPagination({
        page: res.pagination.page,
        totalPages: res.pagination.totalPages,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients(1);
  }, []);

  // ---------------- DELETE ----------------
  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Delete Client?",
      text: "This action cannot be reversed.",
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
      cancelButtonColor: "#1b335a",
    });

    if (result.isConfirmed) {
      await deleteClient(id);
      await loadClients(pagination.page);
    }
  }

  // ---------------- OPEN MODALS ----------------
  const openCreate = () => {
    setEditingClient(null);
    setFormName("");
    setFormContactedBy("");
    setFormEmail("");
    setFormPhone("");
    setShowClientModal(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setFormName(c.name);
    setFormContactedBy(c.contactedBy || "");
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setShowClientModal(true);
  };

  // ---------------- PAGINATION ----------------
  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadClients(page);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="max-h-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Clients</h1>

        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
        >
          Create Client
        </button>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clients.map((c) => (
              <div
                key={c.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm p-4"
              >
                <div className="flex justify-between mb-3 gap-2">
                  <h2 className="text-lg font-semibold truncate">{c.name}</h2>

                  <div className="flex items-center gap-2">
                    <Edit2
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => openEdit(c)}
                    />
                    <Trash2
                      size={18}
                      className="cursor-pointer text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(c.id)}
                    />
                  </div>
                </div>

                <p className="text-md text-gray-600 dark:text-gray-500 mb-1">
                  {c.contactedBy}
                </p>

                <div className="flex items-center justify-between">
                  <p className="flex items-center text-gray-400 text-sm">
                    {c.email}
                  </p>

                  <p className="flex items-center text-sm text-gray-600 dark:text-gray-500">
                    {c.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {clients.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No clients found
            </div>
          )}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePaginate}
          />
        </>
      )}

      {/* ------------ CREATE / EDIT MODAL ------------ */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative">
            <button
              onClick={() => setShowClientModal(false)}
              className="absolute right-4 top-4"
            >
              <X size={22} className="text-[var(--text)]" />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              {editingClient ? "Edit Client" : "Create Client"}
            </h2>

            {/* FORM INPUTS */}
            <div className="space-y-4">
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Client Name"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              <input
                value={formContactedBy}
                onChange={(e) => setFormContactedBy(e.target.value)}
                placeholder="Contacted By"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              <input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="Number"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={async () => {
                const payload = {
                  name: formName,
                  contactedBy: formContactedBy,
                  email: formEmail,
                  number: formPhone,
                };

                if (editingClient) {
                  await updateClient(editingClient.id, payload);
                } else {
                  await createClient(payload);
                }

                setShowClientModal(false);
                loadClients(pagination.page);
              }}
              className="mt-6 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              {editingClient ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
