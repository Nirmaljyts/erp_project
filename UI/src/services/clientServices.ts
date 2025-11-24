import { axiosInstance } from "./interceptor";

// LIST CLIENTS
export async function getClients(
  page = 1,
  limit = 10,
  search = "",
  sort = "name",
  order = "asc"
) {
  const res = await axiosInstance.get(
    `/clients?page=${page}&limit=${limit}&search=${search}&sort=${sort}&order=${order}`
  );
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
