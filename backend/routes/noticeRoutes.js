const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload        = require("../middleware/uploadMiddleware");
const Notice        = require("../models/Notice");

router.use(protect);

// Get notices (all roles — filtered by target)
router.get("/", async (req, res) => {
  try {
    const { targetType, priority, page = 1, limit = 30 } = req.query;
    const query = { isActive: true };
    if (targetType) query.targetType = targetType;
    if (priority)   query.priority   = priority;
    const total   = await Notice.countDocuments(query);
    const notices = await Notice.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: notices, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get single notice
router.get("/:id", async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: notice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Create notice (admin/professor)
router.post("/", authorize("admin", "professor"), upload.single("attachment"), async (req, res) => {
  try {
    const { title, content, targetType, targetDepartment, priority, isForced, scheduledAt, expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required" });
    const notice = await Notice.create({
      title, content,
      createdBy:    req.user.name,
      createdByRef: req.user._id,
      targetType:   targetType || "global",
      targetDepartment,
      priority:     priority || "normal",
      isForced:     isForced === "true" || isForced === true,
      scheduledAt:  scheduledAt ? new Date(scheduledAt) : null,
      expiresAt:    expiresAt   ? new Date(expiresAt)   : null,
      attachmentUrl: req.file?.path,
      isActive:     true,
    });
    const io = req.app.get("io");
    if (io && !scheduledAt) {
      io.to("role:student").emit("new_notification", {
        type: "notice", title: notice.title,
        message: notice.content.slice(0, 100),
        isForced: notice.isForced, _id: notice._id,
      });
    }
    res.status(201).json({ success: true, data: notice, message: "Notice published" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update notice
router.put("/:id", authorize("admin", "professor"), upload.single("attachment"), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, { ...req.body, ...(req.file?.path && { attachmentUrl: req.file.path }) }, { new: true });
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.json({ success: true, data: notice });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete notice
router.delete("/:id", authorize("admin", "professor"), async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark as read
router.put("/:id/read", async (req, res) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
    res.json({ success: true, message: "Marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;