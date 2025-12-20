import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  Notification,
  markAllNotificationsRead,
} from "../services/notificationService";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

type Props = {
  open: boolean;
  onClose: () => void;
  onRead: () => void;
};

export default function NotificationSidebar({ open, onClose, onRead }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role || "";

  useEffect(() => {
    if (open) {
      getNotifications().then((res) => setItems(res.data));
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 h-full w-64 bg-[var(--card)] border-l border-[var(--border)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-lg">Notifications</h2>

          <div className="flex items-center gap-2">
            <X className="cursor-pointer" size={18} onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No notifications</p>
          )}

          {items.map((n) => (
            <div
              key={n.id}
              className={`p-4 border-b cursor-pointer ${
                n.isRead ? "" : "bg-blue-50 dark:bg-blue-900/20"
              }`}
              onClick={async () => {
                await markNotificationRead(n.id);

                onRead();

                navigate(resolveRoute(n, role));
                onClose();
              }}
            >
              <div className="font-medium cursor-pointer">{n.title}</div>
              <div className="text-sm text-gray-600 cursor-pointer dark:text-gray-400">
                {n.message}
              </div>
            </div>
          ))}
        </div>

        {items.some((n) => !n.isRead) && (
          <div className="flex items-center justify-center py-2 bg-[var(--icon-bg)] text-[var(--text)]">
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={async () => {
                await markAllNotificationsRead();
                setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
                onRead();
              }}
            >
              Mark All Read
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function resolveRoute(n: Notification, role: string) {
  // --- LEAVE REQUESTED (two audiences) ---
  if (n.type === "LEAVE_REQUESTED") {
    // Applicant notification
    if (n.title === "Leave applied") {
      return "/request-leaves";
    }

    // Reviewer notification
    if (n.title === "Leave approval required") {
      return "/leave-approvals";
    }
  }

  // --- LEAVE APPROVED / REJECTED ---
  if (n.type === "LEAVE_APPROVED" || n.type === "LEAVE_REJECTED") {
    return "/request-leaves";
  }

  // --- TIMESHEETS ---
  if (n.type.startsWith("TIMESHEET")) {
    return role === "EMPLOYEE"
      ? "/my-timesheet"
      : "/timesheet-approvals";
  }

  return "/leaves";
}

