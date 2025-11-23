import { axiosInstance } from "./interceptor";

// LIST HOLIDAYS
export async function getHolidays(year: number) {
  const res = await axiosInstance.get(`/holidays?year=${year}`);
  return res.data;
}

// CREATE HOLIDAY
export async function createHoliday(payload: {
  date: string;
  name: string;
  isOptional: boolean;
}) {
  const res = await axiosInstance.post(`/holidays`, payload);
  return res.data;
}

// UPDATE HOLIDAY
export async function updateHoliday(id: number, payload: any) {
  return axiosInstance.put(`/holidays/${id}`, payload);
}

// DELETE HOLIDAY
export async function deleteHoliday(id: number) {
  const res = await axiosInstance.delete(`/holidays/${id}`);
  return res.data;
}

// UPLOAD HOLIDAYS IN CSV
export async function uploadHolidayFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post(`/holidays/bulk`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
