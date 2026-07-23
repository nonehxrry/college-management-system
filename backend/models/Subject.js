const mongoose = require("mongoose");

const syllabusItemSchema = new mongoose.Schema({
  unit: { type: Number, required: true },
  title: { type: String, required: true },
  topics: [String],
  hours: { type: Number, default: 0 },
});

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["pdf", "ppt", "video", "link", "other"], default: "pdf" },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 1 },
  isArchived: { type: Boolean, default: false },
});

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      default: 3,
    },
    type: {
      type: String,
      enum: ["theory", "practical", "elective"],
      default: "theory",
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professor",
      default: null,
    },
    section: {
      type: String,
      default: "A",
    },
    syllabus: [syllabusItemSchema],
    studyMaterials: [studyMaterialSchema],
    maxInternalMarks: {
      type: Number,
      default: 30,
    },
    maxPracticalMarks: {
      type: Number,
      default: 25,
    },
    maxExternalMarks: {
      type: Number,
      default: 70,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);