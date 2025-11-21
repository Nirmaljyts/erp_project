import { axiosInstance } from "./interceptor";

// LIST CLIENTS
export async function getClients(page = 1) {
  const res = await axiosInstance.get(`/clients?page=${page}`);
  return res.data;
}

// CREATE CLIENT
export async function createClient(data: any) {
  return (await axiosInstance.post(`/clients`, data)).data;
}

// UPDATE CLIENT
export async function updateClient(id: number, data: any) {
  return (await axiosInstance.put(`/clients/${id}`, data)).data;
}

// DELETE CLIENT
export async function deleteClient(id: number) {
  return (await axiosInstance.delete(`/clients/${id}`)).data;
}
