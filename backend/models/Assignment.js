const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
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
    section: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 10,
    },
    allowedFormats: {
      type: [String],
      default: ["pdf", "docx", "zip"],
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);