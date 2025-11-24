import { axiosInstance } from "./interceptor";

export async function getUsers(page = 1, limit = 10, sort = "name", order = "asc") {
  const res = await axiosInstance.get(
    `/users?page=${page}&limit=${limit}&sort=${sort}&order=${order}`
  );
  return res.data;
}

export async function createUser(data: any) {
  return (await axiosInstance.post(`/users`, data)).data;
}

export async function updateUser(id: number, data: any) {
  return (await axiosInstance.put(`/users/${id}`, data)).data;
}

export async function deleteUser(id: number) {
  return (await axiosInstance.delete(`/users/${id}`)).data;
}
