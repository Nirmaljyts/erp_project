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

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

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

  function validateName(name: string) {
    return name.trim().length >= 3;
  }

  function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function validatePhone(phone: string) {
    const phoneRegex = /^[0-9]{10,15}$/; // only digits, length between 10-15
    return phoneRegex.test(phone);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let isValid = true;

    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim();
    const cleanPhone = formPhone.trim();

    if (!validateName(cleanName)) {
      setNameError("Client name must be at least 3 characters");
      isValid = false;
    } else {
      setNameError("");
    }

    if (!validateEmail(cleanEmail)) {
      setEmailError("Enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!validatePhone(cleanPhone)) {
      setPhoneError("Enter a valid phone number (10–15 digits)");
      isValid = false;
    } else {
      setPhoneError("");
    }

    if (!isValid) return;

    const payload = {
      name: cleanName,
      contactedBy: formContactedBy.trim(),
      email: cleanEmail,
      phone: cleanPhone,
    };

    try {
      if (editingClient) {
        await updateClient(editingClient.id, payload);
      } else {
        await createClient(payload);
      }

      closeModal();
      loadClients(pagination.page);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong. Try again later.", "error");
    }
  }

  const closeModal = () => {
    setNameError("");
    setEmailError("");
    setPhoneError("");
    setShowClientModal(false);
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
            <div className="text-center text-gray-500 py-10">No Data</div>
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
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl relative"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4"
            >
              <X size={22} className="text-[var(--text)]" />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">
              {editingClient ? "Edit Client" : "Create Client"}
            </h2>

            {/* FORM INPUTS */}
            <div className="space-y-2">
              <input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="Client Name"
                className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                  nameError ? "border-red-500" : "border-[var(--border)]"
                }`}
              />
              {nameError && (
                <p className="text-red-500 text-sm m-0">{nameError}</p>
              )}

              <input
                value={formContactedBy}
                onChange={(e) => setFormContactedBy(e.target.value)}
                placeholder="Contacted By"
                className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
              />

              <input
                type="email"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="Email"
                className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                  emailError ? "border-red-500" : "border-[var(--border)]"
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}

              <input
                type="text"
                value={formPhone}
                onChange={(e) => {
                  setFormPhone(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
                placeholder="Phone Number"
                className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                  phoneError ? "border-red-500" : "border-[var(--border)]"
                }`}
              />

              {phoneError && (
                <p className="text-red-500 text-sm m-0 p-0">{phoneError}</p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="mt-6 w-full py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              {editingClient ? "Update" : "Create"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
