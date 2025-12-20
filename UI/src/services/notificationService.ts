import { axiosInstance } from "./interceptor";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  entityId?: number;
  isRead: boolean;
  createdAt: string;
}

export function getNotifications() {
  return axiosInstance.get<Notification[]>("/notifications");
}

export function markNotificationRead(id: number) {
  return axiosInstance.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return axiosInstance.patch("/notifications/read-all");
}
