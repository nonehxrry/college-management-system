import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from "react";
import { useAuth }   from "./AuthContext";
import { useSocket } from "./SocketContext";
import api           from "../services/api";
import toast         from "react-hot-toast";

const NotificationContext = createContext(null);

const TYPE_ICONS = {
  notice:     "📢",
  assignment: "📋",
  result:     "📊",
  attendance: "📅",
  fee:        "💰",
  ticket:     "🎫",
  deadline:   "⏰",
  shortage:   "⚠️",
  general:    "🔔",
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { on, off, acknowledgeNotification } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [forcedPopup,   setForcedPopup]   = useState(null);
  const [loading,       setLoading]       = useState(false);
  const audioRef = useRef(null);

  // ── Fetch on auth — fully silent if backend is offline ────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setForcedPopup(null);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", { params: { limit: 30 } });
      const list = data.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // Backend offline or mock mode — just use empty list, don't crash
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Real-time: new notification ────────────────────────────────────────────
  useEffect(() => {
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
      setUnreadCount((c) => c + 1);
      try { audioRef.current?.play(); } catch {}

      const icon = TYPE_ICONS[notification.type] || "🔔";
      toast(
        <div className="flex items-start gap-2">
          <span>{icon}</span>
          <div>
            <p className="font-semibold text-sm leading-tight">{notification.title}</p>
            {notification.message && (
              <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">
                {notification.message}
              </p>
            )}
          </div>
        </div>,
        { duration: 4000 }
      );

      if (notification.isForced) setForcedPopup(notification);
    };

    on("new_notification", handler);
    return () => off("new_notification", handler);
  }, [on, off]);

  // ── Real-time: forced popup ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (data) => setForcedPopup(data);
    on("forced_popup", handler);
    return () => off("forced_popup", handler);
  }, [on, off]);

  // ── Mark one as read ───────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic update first
    setNotifications((prev) =>
      prev.map((n) => n._id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await api.put(`/notifications/${notificationId}/read`); } catch {}
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await api.put("/notifications/read-all"); } catch {}
  }, []);

  // ── Dismiss forced popup ───────────────────────────────────────────────────
  const dismissForcedPopup = useCallback(async (notificationId) => {
    setForcedPopup(null);
    try {
      await api.put(`/notifications/${notificationId}/acknowledge`);
      acknowledgeNotification(notificationId);
    } catch {}
  }, [acknowledgeNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        forcedPopup,
        loading,
        markAsRead,
        markAllAsRead,
        dismissForcedPopup,
        refetch: fetchNotifications,
        TYPE_ICONS,
      }}
    >
      <audio ref={audioRef} src="/notification.mp3" preload="none" />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

export default NotificationContext;