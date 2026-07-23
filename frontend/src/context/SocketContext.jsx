import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io }          from "socket.io-client";
import { storage }     from "../utils/helpers";
import { useAuth }     from "./AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// ─── Context ──────────────────────────────────────────────────────────────────
const SocketContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const socketRef  = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport,   setTransport]   = useState("");

  // ── Connect when user authenticates ────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      _disconnect();
      return;
    }

    const token = storage.get("accessToken");

    const socket = io(SOCKET_URL, {
      auth:               { token },
      transports:         ["websocket", "polling"],
      reconnection:       true,
      reconnectionAttempts: 5,
      reconnectionDelay:  2000,
      timeout:            10_000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      // Join personal + role rooms
      socket.emit("join_room", `user:${user._id}`);
      socket.emit("join_room", `role:${user.role}`);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setIsConnected(false);
    });

    socket.io.engine.on("upgrade", () => {
      setTransport(socket.io.engine.transport.name);
    });

    return () => _disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id]);

  const _disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  // ── Emit helpers ───────────────────────────────────────────────────────────
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  /** Acknowledge a forced popup */
  const acknowledgeNotification = useCallback((notificationId) => {
    emit("acknowledge_notification", { notificationId });
  }, [emit]);

  return (
    <SocketContext.Provider
      value={{
        socket:      socketRef.current,
        isConnected,
        transport,
        emit,
        on,
        off,
        acknowledgeNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

export default SocketContext;