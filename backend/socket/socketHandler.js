const jwt = require("jsonwebtoken");
const User = require("../models/User");

const connectedUsers = new Map();

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);

    socket.join(`user:${userId}`);
    socket.join(`role:${socket.user.role}`);

    console.log(`✅ User connected: ${socket.user.name} (${socket.user.role}) - Socket: ${socket.id}`);

    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("leave_room", (room) => {
      socket.leave(room);
    });

    socket.on("acknowledge_notification", (notificationId) => {
      socket.emit("notification_acknowledged", notificationId);
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      console.log(`❌ User disconnected: ${socket.user.name}`);
    });
  });
};

const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit("new_notification", notification);
};

const sendNotificationToRole = (io, role, notification) => {
  io.to(`role:${role}`).emit("new_notification", notification);
};

const sendNotificationToAll = (io, notification) => {
  io.emit("new_notification", notification);
};

const sendForcedPopup = (io, userId, data) => {
  io.to(`user:${userId}`).emit("forced_popup", data);
};

const sendForcedPopupToAll = (io, data) => {
  io.emit("forced_popup", data);
};

const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

module.exports = {
  setupSocket,
  sendNotificationToUser,
  sendNotificationToRole,
  sendNotificationToAll,
  sendForcedPopup,
  sendForcedPopupToAll,
  isUserOnline,
  connectedUsers,
};