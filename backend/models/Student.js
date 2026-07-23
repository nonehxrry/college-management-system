const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      unique: true,
      trim: true,
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
      min: 1,
      max: 10,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    batch: {
      type: String,
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    fatherName: {
      type: String,
      default: "",
    },
    motherName: {
      type: String,
      default: "",
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    bloodGroup: {
      type: String,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    cgpa: {
      type: Number,
      default: 0,
    },
    idCardUrl: {
      type: String,
      default: "",
    },
    medicalCertificates: [
      {
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        description: String,
      },
    ],
    internshipProofs: [
      {
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        companyName: String,
        duration: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);