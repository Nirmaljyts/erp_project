import {
  getAllProjects,
  getProjectById,
  createNewProject,
  updateExistingProject,
  assignUsersService,
  removeEmployeeFromProjectService,
  updateProjectStatusService,
  deleteProjectService
} from "../services/projectService.js";

export async function listProjects(req, res) {
  try {
    const result = await getAllProjects(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to list projects" });
  }
}

export async function getProject(req, res) {
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
}

export async function createProject(req, res) {
  try {
    const project = await createNewProject(req.body);
    res.json({ message: "Project created", project });
  } catch {
    res.status(500).json({ message: "Failed to create project" });
  }
}

export async function updateProject(req, res) {
  try {
    await updateExistingProject(req.params.id, req.body);
    res.json({ message: "Project updated" });
  } catch {
    res.status(500).json({ message: "Failed to update project" });
  }
}

export async function deleteProject(req, res) {
  try {
    await deleteProjectService(req.params.id);
    return res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    return res.status(500).json({ message: err.message || "Failed to delete project" });
  }
}

export async function assignUsersToProject(req, res) {
  try {
    const result = await assignUsersService(req.params.id, req.body);
    res.json({ message: "Assignments updated", result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function removeEmployeeFromProject(req, res) {
  try {
    const { id, employeeId } = req.params;

    await removeEmployeeFromProjectService(id, employeeId);

    res.json({ message: "Employee removed from project" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateProjectStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "ACTIVE",
      "IN_PROGRESS",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updated = await updateProjectStatusService(id, status);

    res.json({ message: "Project status updated", project: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
