const express    = require("express");
const router     = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload        = require("../middleware/uploadMiddleware");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

router.use(protect);

// Get all assignments (admin view)
router.get("/", authorize("admin"), async (req, res) => {
  try {
    const { subject, professor, isActive } = req.query;
    const query = {};
    if (subject)   query.subject   = subject;
    if (professor) query.professor = professor;
    if (isActive !== undefined) query.isActive = isActive === "true";
    const assignments = await Assignment.find(query)
      .populate("subject", "name code").populate("professor", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: assignments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get single assignment
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("subject", "name code").populate("professor", "name");
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    res.json({ success: true, data: assignment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get all submissions for an assignment (professor/admin)
router.get("/:id/submissions", authorize("professor", "admin"), async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate({ path: "student", populate: { path: "user", select: "name email avatar" } })
      .sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Grade a submission
router.put("/submissions/:id/grade", authorize("professor", "admin"), async (req, res) => {
  try {
    const { marksObtained, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { marksObtained, feedback, gradedAt: new Date() },
      { new: true }
    );
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    res.json({ success: true, data: submission, message: "Graded successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Toggle assignment active status
router.patch("/:id/toggle", authorize("professor", "admin"), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    assignment.isActive = !assignment.isActive;
    await assignment.save();
    res.json({ success: true, data: { isActive: assignment.isActive } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;