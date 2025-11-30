import {
  fetchUsersService,
  fetchUserService,
  createUserService,
  updateUserService,
  deleteUserService,
  getManagersService,
  getAvailableEmployeesService,
} from "../services/userService.js";

export async function listUsers(req, res) {
  try {
    const result = await fetchUsersService(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list users" });
  }
}

export async function getUserById(req, res) {
  try {
    const user = await fetchUserService(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch user" });
  }
}

export async function createUser(req, res) {
  try {
    const user = await createUserService(req.body);
    return res.status(201).json({ message: "User created", user });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email already in use" });
    }
    return res
      .status(500)
      .json({ message: err.message || "Failed to create user" });
  }
}

export async function updateUser(req, res) {
  try {
    const updated = await updateUserService(req.params.id, req.body);
    return res.json({ message: "User updated", user: updated });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email already in use" });
    }
    return res
      .status(500)
      .json({ message: err.message || "Failed to update user" });
  }
}

export async function deleteUser(req, res) {
  try {
    await deleteUserService(req.params.id, req.user);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }
}

export async function listManagers(req, res) {
  try {
    const managers = await getManagersService(req.user);
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

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
