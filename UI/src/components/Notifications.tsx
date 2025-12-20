import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  Notification,
} from "../services/notificationService";

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications().then(res => setItems(res.data));
  }, []);

  const unread = items.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <Bell />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 rounded-full">
          {unread}
        </span>
      )}

      <div className="absolute right-0 mt-2 w-80 bg-white shadow rounded">
        {items.map(n => (
          <div
            key={n.id}
            className={`p-3 cursor-pointer ${
              n.isRead ? "" : "bg-gray-100"
            }`}
            onClick={() => {
              markNotificationRead(n.id);
              navigate(resolveRoute(n));
            }}
          >
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm">{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function resolveRoute(n: Notification) {
  if (n.type.startsWith("LEAVE")) return `/leaves/${n.entityId}`;
  if (n.type.startsWith("TIMESHEET")) return `/timesheets/${n.entityId}`;
  return "/";
}
