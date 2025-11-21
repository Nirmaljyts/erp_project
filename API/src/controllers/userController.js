import {
  fetchUsersService,
  fetchUserService,
  createUserService,
  updateUserService,
  deleteUserService,
  getManagersService,
  getAvailableEmployeesService
} from "../services/userService.js";

export async function listUsers(req, res) {
  try {
    const result = await fetchUsersService(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to list users" });
  }
}

export async function getUserById(req, res) {
  try {
    const user = await fetchUserService(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

export async function createUser(req, res) {
  try {
    const user = await createUserService(req.body);
    res.json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create user" });
  }
}

export async function updateUser(req, res) {
  try {
    const updated = await updateUserService(req.params.id, req.body);
    res.json({ message: "User updated", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  try {
    await deleteUserService(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete user" });
  }
}

// ONLY MANAGERS
export async function listManagers(req, res) {
  try {
    const managers = await getManagersService();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// AVAILABLE EMPLOYEES (NOT ASSIGNED TO OTHER ACTIVE PROJECTS)
export async function listAvailableEmployees(req, res) {
  try {
    const { projectId } = req.query;
    const employees = await getAvailableEmployeesService(
      projectId ? Number(projectId) : undefined
    );
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
