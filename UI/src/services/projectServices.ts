import { axiosInstance } from "./interceptor";

// --------------------------
// LIST PROJECTS
// --------------------------
export async function getProjects(
  page = 1,
  limit = 12,
  search = "",
  sort = "name",
  order = "asc"
) {
  const res = await axiosInstance.get(
    `/projects?page=${page}&limit=${limit}&search=${search}&sort=${sort}&order=${order}`
  );
  return res.data;
}

export async function validateEmployees(
  projectId: number | null,
  employees: number[]
) {
  const res = await axiosInstance.post("/projects/validate-employees", {
    projectId,
    employees,
  });
  return res.data; // { valid: boolean }
}

// --------------------------
// CREATE PROJECT
// --------------------------
export async function createProject(data: any) {
  return (await axiosInstance.post(`/projects`, data)).data;
}

// --------------------------
// UPDATE PROJECT
// --------------------------
export async function updateProject(id: number, data: any) {
  return (await axiosInstance.put(`/projects/${id}`, data)).data;
}

// --------------------------
// DELETE PROJECT
// --------------------------
export async function deleteProject(id: number) {
  return (await axiosInstance.delete(`/projects/${id}`)).data;
}

// --------------------------
// ASSIGN MANAGER + EMPLOYEES
// --------------------------
export async function assignUsers(id: number, data: any) {
  return (await axiosInstance.put(`/projects/${id}/assign`, data)).data;
}

// --------------------------
// REMOVE EMPLOYEE FROM PROJECT
// --------------------------
export async function removeEmployee(projectId: number, employeeId: number) {
  console.log('hello');
  
  return (
    await axiosInstance.delete(
      `/projects/${projectId}/remove-employee/${employeeId}`
    )
  ).data;
}

// --------------------------
// GET ALL MANAGERS
// backend: /users/managers
// --------------------------
export async function getManagers() {
  return (await axiosInstance.get(`/users/managers`)).data;
}

// --------------------------
// GET AVAILABLE EMPLOYEES
// backend: /users/employees
// --------------------------
export async function getEmployees(projectId?: number) {
  const url = projectId
    ? `/users/employees?projectId=${projectId}`
    : "/users/employees";

  return (await axiosInstance.get(url)).data;
}

// --------------------------
// UPDATE ONLY PROJECT STATUS
// --------------------------
export async function updateProjectStatus(id: number, status: string) {
  return (await axiosInstance.put(`/projects/${id}/status`, { status })).data;
}
