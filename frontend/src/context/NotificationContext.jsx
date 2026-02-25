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
  const { isAuthenticated, user } = useAuth();
  const { on, off, acknowledgeNotification } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [forcedPopup,   setForcedPopup]   = useState(null);   // { title, message, notificationId, … }
  const [loading,       setLoading]       = useState(false);
  const audioRef = useRef(null);

  // ── Fetch on auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    else { setNotifications([]); setUnreadCount(0); setForcedPopup(null); }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", { params: { limit: 30 } });
      const list = data.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Real-time: new notification ────────────────────────────────────────────
  useEffect(() => {
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
      setUnreadCount((c) => c + 1);

      // Play sound (best-effort)
      try { audioRef.current?.play(); } catch {}

      // Toast notification
      const icon = TYPE_ICONS[notification.type] || "🔔";
      toast(
        <div className="flex items-start gap-2">
          <span>{icon}</span>
          <div>
            <p className="font-semibold text-sm leading-tight">{notification.title}</p>
            {notification.message && (
              <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">{notification.message}</p>
            )}
          </div>
        </div>,
        { duration: 4000 }
      );

      // Forced popup overrides normal flow
      if (notification.isForced) {
        setForcedPopup(notification);
      }
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
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }, []);

  // ── Mark all as read ───────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  // ── Dismiss forced popup (with acknowledgement) ───────────────────────────
  const dismissForcedPopup = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/acknowledge`);
      acknowledgeNotification(notificationId);
    } catch {}
    setForcedPopup(null);
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
      {/* Silent notification chime */}
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