import { useEffect, useState } from "react";
import { Edit2, Trash2, X, Plus, EyeOff, Eye } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userServices";
import Pagination from "../components/Pagination";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import Tooltip from "../components/Tooltip";

interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<
    "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE"
  >("EMPLOYEE");
  const [formActive, setFormActive] = useState(true);
  const [formPassword, setFormPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const user = useSelector((state: RootState) => state?.auth?.user);
  const currentRole = user?.role;

  async function loadUsers(page = 1, searchValue = search) {
    const limit = 15;
    try {
      setLoading(true);
      const res = await getUsers(page, limit, searchValue, sortBy, sortOrder);
      setUsers(res.data);
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
    loadUsers(1, value);
  };

  useEffect(() => {
    loadUsers(1, search);
  }, [sortBy, sortOrder]);

  function toggleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }

  function validateName(name: string) {
    return name.trim().length >= 3;
  }

  function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  function validatePassword(password: string) {
    // Only required on create, optional on edit
    return password.length >= 6;
  }

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("EMPLOYEE");
    setFormActive(true);
    setFormPassword("");
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setShowUserModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormActive(u.isActive);
    setFormPassword("");
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setNameError("");
    setEmailError("");
    setPasswordError("");
  };

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();

    let valid = true;
    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim();
    const cleanPassword = formPassword.trim();

    if (!validateName(cleanName)) {
      setNameError("Name must be at least 3 characters");
      valid = false;
    } else {
      setNameError("");
    }

    if (!validateEmail(cleanEmail)) {
      setEmailError("Enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }

    // password required only when creating a new user
    if (!editingUser) {
      if (!validatePassword(cleanPassword)) {
        setPasswordError("Password must be at least 6 characters");
        valid = false;
      } else {
        setPasswordError("");
      }
    } else {
      // editing: password optional; if provided, validate
      if (cleanPassword && !validatePassword(cleanPassword)) {
        setPasswordError("Password must be at least 6 characters");
        valid = false;
      } else {
        setPasswordError("");
      }
    }

    if (!valid) return;

    const payload: any = {
      name: cleanName,
      email: cleanEmail,
      role: formRole,
      isActive: formActive,
    };

    if (!editingUser || cleanPassword) {
      payload.password = cleanPassword;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        toast.success("User updated");
      } else {
        await createUser(payload);
        toast.success("User created");
      }

      closeUserModal();
      loadUsers(pagination.page, search);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      Swal.fire(
        "Error",
        errorMessage || "Failed to save user. Please try again.",
        "error"
      );
    }
  }

  async function handleDelete(id: number) {
    const result = await Swal.fire({
      title: "Delete User?",
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
      await deleteUser(id);
      await loadUsers(pagination.page, search);

      toast.success("User deleted");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to delete user. Try again.";

      Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: message,
      });
    }
  }

  const handlePaginate = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      loadUsers(page, search);
    }
  };

  const roleClasses: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    HR_MANAGER: "bg-green-100 text-green-700",
    HR: "bg-orange-100 text-orange-700",
    MANAGER: "bg-yellow-100 text-yellow-700",
    EMPLOYEE: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="max-h-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72 md:w-64 lg:w-80">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                let value = e.target.value.trimStart();

                value = value.trimStart();

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
                <X size={18} />
              </button>
            )}
          </div>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
          >
            Create User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-overlay">
          <div className="loader-all"></div>
        </div>
      ) : (
        <>
          <div className="border border-[var(--border)] rounded-xl bg-[var(--card)]">
            <table className="table text-xs md:text-sm border-collapse">
              <thead className="t_head table_th">
                <tr>
                  <th className="min-w-[10%] px-4 py-3 text-left text-xs font-bold uppercase">
                    #
                  </th>

                  <th
                    onClick={() => toggleSort("name")}
                    className="min-w-[18%] px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer"
                  >
                    Name{" "}
                    {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>

                  <th
                    onClick={() => toggleSort("email")}
                    className="min-w-[20%] px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer"
                  >
                    Email{" "}
                    {sortBy === "email" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>

                  <th
                    onClick={() => toggleSort("role")}
                    className="min-w-[18%] px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer"
                  >
                    Role{" "}
                    {sortBy === "role" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>

                  <th
                    onClick={() => toggleSort("isActive")}
                    className="min-w-[18%] px-4 py-3 text-left text-xs font-bold uppercase cursor-pointer"
                  >
                    Status{" "}
                    {sortBy === "isActive" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>

                  {(currentRole === "ADMIN" ||
                    currentRole === "HR_MANAGER" ||
                    currentRole === "HR") && (
                    <th className="min-w-[20%] px-4 py-3 text-right text-xs font-semibold uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr className="border-t-2">
                    <td
                      colSpan={6}
                      className="table_td px-4 py-6 text-center text-gray-500"
                    >
                      No Data
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td
                        className="table_td min-w-[10%] px-4 py-2 text-sm"
                        data-label="#"
                      >
                        {index + 1}
                      </td>

                      <td
                        className="table_td min-w-[18%] px-4 py-2 text-sm truncate"
                        data-label="Name"
                      >
                        {user.name}
                      </td>

                      <td
                        className="table_td min-w-[20%] px-4 py-2 text-sm truncate"
                        data-label="Email"
                      >
                        {user.email}
                      </td>

                      <td
                        className="table_td min-w-[18%] px-4 py-2 text-sm"
                        data-label="Role"
                      >
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            roleClasses[user.role] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td
                        className="table_td min-w-[18%] px-4 py-2 text-sm"
                        data-label="Status"
                      >
                        {user.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                      </td>

                      {(currentRole === "ADMIN" ||
                        currentRole === "HR_MANAGER" ||
                        currentRole === "HR") && (
                        <td className="table_td min-w-[18%] px-4 py-2 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(user)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Tooltip text="Edit User" position="left">
                                <Edit2 size={18} className="cursor-pointer" />
                              </Tooltip>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Tooltip text="Delete User" position="left">
                                <Trash2 size={18} className="cursor-pointer" />
                              </Tooltip>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="fixed bottom-0 left-0 right-0 shadow-md p-3 z-50">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePaginate}
            />
          </div>
        </>
      )}

      {/* ------------ USER CREATE/EDIT MODAL ------------ */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleUserSubmit}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 relative w-full max-w-xl max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={closeUserModal}
              className="absolute right-4 top-4 cursor-pointer"
            >
              <Tooltip text="Close" position="left">
                <X size={22} className="text-[var(--text)] cursor-pointer" />
              </Tooltip>
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[var(--text)]">
              {editingUser ? "Edit User" : "Add User"}
            </h2>

            <div className="space-y-2">
              <div>
                <input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  placeholder="Full Name"
                  className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                    nameError ? "border-red-500" : "border-[var(--border)]"
                  }`}
                />
                {nameError && (
                  <p className="text-red-500 text-xs mt-1">{nameError}</p>
                )}
              </div>

              <div>
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
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>

              {!editingUser && (
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => {
                      setFormPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    placeholder={
                      editingUser ? "New Password (optional)" : "Password"
                    }
                    className={`w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border ${
                      passwordError
                        ? "border-red-500"
                        : "border-[var(--border)]"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                  )}
                </div>
              )}

              <div>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as User["role"])}
                  className="w-full p-2 rounded-lg bg-[var(--card)] text-[var(--text)] border border-[var(--border)]"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="HR_MANAGER">HR_MANAGER</option>
                  <option value="HR">HR</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`relative inline-flex h-6 w-10 p-0 items-center rounded-full transition ${
                    formActive ? "bg-[#1b335a]" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 p-0 transform rounded-full bg-white transition ${
                      formActive ? "translate-x-5" : "translate-x-1"
                    }`}
                  ></span>
                </button>

                <label
                  className="text-sm ml-2 cursor-pointer flex items-center"
                  onClick={() => setFormActive(!formActive)}
                >
                  Active
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 rounded-lg bg-[#2f4f82] text-white font-medium hover:bg-[#1b335a]"
            >
              {editingUser ? "Update User" : "Create User"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
