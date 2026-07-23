const mongoose = require("mongoose");

const subjectResultSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  internalMarks: {
    type: Number,
    default: 0,
  },
  practicalMarks: {
    type: Number,
    default: 0,
  },
  externalMarks: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  maxMarks: {
    type: Number,
    default: 100,
  },
  grade: {
    type: String,
    default: "",
  },
  gradePoints: {
    type: Number,
    default: 0,
  },
  credits: {
    type: Number,
    default: 3,
  },
  status: {
    type: String,
    enum: ["pass", "fail", "absent", "withheld"],
    default: "pass",
  },
  reEvaluationRequested: {
    type: Boolean,
    default: false,
  },
});

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    subjects: [subjectResultSchema],
    sgpa: {
      type: Number,
      default: 0,
    },
    totalCreditsEarned: {
      type: Number,
      default: 0,
    },
    totalCreditsAttempted: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    scheduledPublishAt: {
      type: Date,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    resultPdfUrl: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, semester: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);