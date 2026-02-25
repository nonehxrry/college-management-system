const mongoose = require("mongoose");

const professorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: {
      type: String,
      enum: ["Assistant Professor", "Associate Professor", "Professor", "HOD", "Dean"],
      default: "Assistant Professor",
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    qualification: {
      type: String,
      default: "",
    },
    experience: {
      type: Number,
      default: 0,
    },
    specialization: {
      type: String,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    isClassMentor: {
      type: Boolean,
      default: false,
    },
    mentorSection: {
      type: String,
      default: "",
    },
    mentorSemester: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Professor", professorSchema);