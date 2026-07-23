const express      = require("express");
const router       = express.Router();
const { protect }  = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

router.use(protect);

// Get notifications for logged-in user
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const total = await Notification.countDocuments({ recipient: req.user._id });
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark single notification as read
router.put("/:id/read", async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: "Marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark all as read
router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Acknowledge a forced notification
router.put("/:id/acknowledge", async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, isAcknowledged: true, readAt: new Date() });
    res.json({ success: true, message: "Acknowledged" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Clear all read notifications
router.delete("/clear-read", async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id, isRead: true });
    res.json({ success: true, message: "Read notifications cleared" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;