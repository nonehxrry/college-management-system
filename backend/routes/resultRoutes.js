const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Result  = require("../models/Result");
const Student = require("../models/Student");

router.use(protect);

// Get results (admin — all, professor — their subjects, student — own)
router.get("/", authorize("admin", "professor"), async (req, res) => {
  try {
    const { semester, isPublished, page = 1, limit = 20 } = req.query;
    const query = {};
    if (semester)    query.semester    = semester;
    if (isPublished !== undefined) query.isPublished = isPublished === "true";
    const total   = await Result.countDocuments(query);
    const results = await Result.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate({ path: "student", populate: { path: "user", select: "name" } })
      .populate("subjects.subject", "name code credits");
    res.json({ success: true, data: results, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get single result
router.get("/:id", async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate({ path: "student", populate: { path: "user", select: "name email" } })
      .populate("subjects.subject", "name code credits type");
    if (!result) return res.status(404).json({ success: false, message: "Result not found" });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Create result record
router.post("/", authorize("admin", "professor"), async (req, res) => {
  try {
    const { studentId, semester, academicYear, subjects } = req.body;
    if (!studentId || !semester || !subjects) return res.status(400).json({ success: false, message: "Student, semester and subjects required" });
    const exists = await Result.findOne({ student: studentId, semester });
    if (exists) return res.status(400).json({ success: false, message: "Result already exists for this semester" });
    const result = await Result.create({ student: studentId, semester, academicYear, subjects, isPublished: false });
    res.status(201).json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update result marks
router.put("/:id", authorize("admin", "professor"), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) return res.status(404).json({ success: false, message: "Result not found" });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Publish results
router.post("/publish", authorize("admin"), async (req, res) => {
  try {
    const { resultIds } = req.body;
    if (!Array.isArray(resultIds)) return res.status(400).json({ success: false, message: "resultIds array required" });
    await Result.updateMany({ _id: { $in: resultIds } }, { isPublished: true, publishedAt: new Date() });
    const io = req.app.get("io");
    if (io) io.to("role:student").emit("new_notification", { type: "result", title: "Results Published", message: "Your exam results are now available" });
    res.json({ success: true, message: `${resultIds.length} result(s) published` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Lock result
router.put("/:id/lock", authorize("admin"), async (req, res) => {
  try {
    await Result.findByIdAndUpdate(req.params.id, { isLocked: true });
    res.json({ success: true, message: "Result locked" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;