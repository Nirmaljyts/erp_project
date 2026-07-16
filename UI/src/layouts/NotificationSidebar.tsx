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

  async function handleClearAll() {
    await clearAllNotifications();
    setNotifications([]);
    onRead();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onRead();
  }

  async function handleNotificationClick(notification: Notification) {
    await markNotificationRead(notification.id);
    onRead();
    navigate(resolveRoute(notification, role));
    onClose();
  }

  async function handleClear(e: React.MouseEvent, notificationId: number) {
    e.stopPropagation();

    await clearNotification(notificationId);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      onRead();
    }, 200);
  }

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

        <div className="flex-1 overflow-y-auto px-1">
          {notifications.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="p-4 text-sm text-gray-500">No Notifications</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end px-2 h-5">
                <button
                  className="text-xs text-[var(--text)] hover:underline"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between border border-[var(--border)] bg-[var(--icon-bg)] gap-2 p-2 rounded-lg mb-1
                    ${notification.isRead ? "font-normal" : "font-bold"}
                  `}
                >
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="cursor-pointer">{notification.title}</div>

                    <div className="cursor-pointer text-sm ">
                      {notification.message}
                    </div>
                  </div>

                  <button
                    className="text-gray-400"
                    onClick={(e) => handleClear(e, notification.id)}
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
              onClick={handleMarkAllRead}
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
    return role === "EMPLOYEE" ? "/timesheets/my" : "/timesheets/approvals";
  }

  // --- TIMESHEETS ---
  if (notification.type.startsWith("TIMESHEET")) {
    // Employee receives approved/rejected on "My Timesheet"
    if (role === "EMPLOYEE") {
      return "/timesheets/my";
    }

    // MANAGER/HR/HR_MANAGER/ADMIN review timesheets here
    // (Submitted timesheets that need approval)
    return "/timesheets/approvals";
  }

  return "/";
}
