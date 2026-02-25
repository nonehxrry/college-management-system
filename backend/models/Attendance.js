const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "excused"],
    required: true,
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    lectureNumber: {
      type: Number,
      default: 1,
    },
    section: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    topic: {
      type: String,
      default: "",
    },
    records: [attendanceRecordSchema],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ subject: 1, date: 1, section: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);