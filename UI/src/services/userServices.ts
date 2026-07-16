import { axiosInstance } from "./interceptor";

// LIST USERS
export async function getUsers(
  page = 1,
  limit = 10,
  search = "",
  sort = "name",
  order = "asc"
) {
  const res = await axiosInstance.get(
    `/users?page=${page}&search=${search}&limit=${limit}&sort=${sort}&order=${order}`
  );
  return res.data;
}

// GET USER BY ID
export async function getUser(id: number) {
  return (await axiosInstance.get(`/users/${id}`)).data;
}

// CREATE USERS
export async function createUser(data: any) {
  return (await axiosInstance.post(`/users`, data)).data;
}

// UPDATE USERS
export async function updateUser(id: number, data: any) {
  return (await axiosInstance.put(`/users/${id}`, data)).data;
}

// DELETE USERS
export async function deleteUser(id: number) {
  return (await axiosInstance.delete(`/users/${id}`)).data;
}
