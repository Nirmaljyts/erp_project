import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  Notification,
  markAllNotificationsRead,
  clearNotification,
  clearAllNotifications,
} from "../services/notificationService";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

type Props = {
  open: boolean;
  onClose: () => void;
  onRead: () => void;
};

export default function NotificationSidebar({ open, onClose, onRead }: Props) {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role || "";
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      getNotifications().then((res) => setNotifications(res.data));
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 h-full w-64 bg-[var(--card)] border-l border-[var(--border)] flex flex-col">
        <div className="flex items-center justify-between px-2 py-3 border-b border-[var(--border)]">
          <h2 className="font-semibold text-lg">Notifications</h2>

          <div className="flex items-center gap-2">
            <X className="cursor-pointer" size={18} onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="p-4 text-sm text-gray-500">No Notifications</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end px-2 h-5 border-b border-gray-400">
                <button
                  className="text-xs text-[var(--text)] hover:underline"
                  onClick={async () => {
                    await clearAllNotifications();
                    setNotifications([]);
                    onRead();
                  }}
                >
                  Clear All
                </button>
              </div>

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between gap-2 p-2 border-b border-gray-400 ${
                    notification.isRead
                      ? "bg-[var(--card)] text-[var(--text)] font-normal"
                      : "font-semibold border-b-2 bg-gray-300 dark:bg-gray-500"
                  }`}
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={async () => {
                      await markNotificationRead(notification.id);
                      onRead();
                      navigate(resolveRoute(notification, role));
                      onClose();
                    }}
                  >
                    <div className="cursor-pointer font-medium ">
                      {notification.title}
                    </div>

                    <div className="cursor-pointer text-sm ">
                      {notification.message}
                    </div>
                  </div>

                  <button
                    className="text-gray-400 hover:text-[#2f4f82]"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await clearNotification(notification.id);
                      setNotifications((prev) =>
                        prev.filter((x) => x.id !== notification.id)
                      );
                      onRead();
                    }}
                  >
                    <X size={16} className="cursor-pointer" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {notifications.some((notification) => !notification.isRead) && (
          <div className="flex items-center justify-center py-2 bg-[var(--icon-bg)] text-[var(--text)]">
            <button
              className="text-xs text-[var(--text)] hover:underline"
              onClick={async () => {
                await markAllNotificationsRead();
                setNotifications((prev) =>
                  prev.map((notification) => ({
                    ...notification,
                    isRead: true,
                  }))
                );
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

function resolveRoute(notification: Notification, role: string) {
  // --- LEAVE REQUESTED (two audiences) ---
  if (notification.type === "LEAVE_REQUESTED") {
    // Applicant notification
    if (notification.title === "Leave applied") {
      return "/request-leaves";
    }

    // Reviewer notification
    if (notification.title === "Leave approval required") {
      return "/leave-approvals";
    }
  }

  // --- LEAVE APPROVED / REJECTED ---
  if (
    notification.type === "LEAVE_APPROVED" ||
    notification.type === "LEAVE_REJECTED"
  ) {
    return "/request-leaves";
  }

  // --- LEAVE CANCELLED ---
  if (notification.type === "LEAVE_CANCELLED") {
    return "/request-leaves";
  }

  // --- TIMESHEETS ---
  if (notification.type.startsWith("TIMESHEET")) {
    return role === "EMPLOYEE" ? "/my-timesheet" : "/timesheet-approvals";
  }

  return "/leaves";
}
