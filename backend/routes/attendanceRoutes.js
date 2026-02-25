const express    = require("express");
const router     = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Attendance = require("../models/Attendance");
const Student    = require("../models/Student");

router.use(protect);

// Get attendance for a subject (professor/admin)
router.get("/subject/:subjectId", authorize("professor", "admin"), async (req, res) => {
  try {
    const { startDate, endDate, section } = req.query;
    const query = { subject: req.params.subjectId };
    if (startDate || endDate) query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate)   query.date.$lte = new Date(endDate);
    if (section)   query.section   = section;
    const records = await Attendance.find(query).sort({ date: -1 })
      .populate("records.student", "rollNumber user").populate("subject", "name code");
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get single student attendance across all subjects (admin)
router.get("/student/:studentId", authorize("admin", "professor"), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    const records = await Attendance.find({ "records.student": student._id })
      .populate("subject", "name code").sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get attendance by ID
router.get("/:id", authorize("professor", "admin"), async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate("records.student", "rollNumber user").populate("subject", "name code");
    if (!record) return res.status(404).json({ success: false, message: "Attendance record not found" });
    res.json({ success: true, data: record });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Update a single student status in an attendance record
router.patch("/:id/student/:studentId", authorize("professor", "admin"), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ success: false, message: "Record not found" });
    const rec = attendance.records.find((r) => r.student.toString() === req.params.studentId);
    if (!rec)  return res.status(404).json({ success: false, message: "Student not in this record" });
    rec.status = status;
    if (reason) rec.reason = reason;
    await attendance.save();
    res.json({ success: true, message: "Status updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Delete attendance record (admin only)
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Attendance record deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;