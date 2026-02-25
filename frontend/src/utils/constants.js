export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const ROLES = {
  STUDENT: "student",
  PROFESSOR: "professor",
  ADMIN: "admin",
};

export const ATTENDANCE_THRESHOLD = 75;

export const GRADE_SCALE = {
  O: { min: 90, points: 10, label: "Outstanding" },
  "A+": { min: 80, points: 9, label: "Excellent" },
  A: { min: 70, points: 8, label: "Very Good" },
  "B+": { min: 60, points: 7, label: "Good" },
  B: { min: 55, points: 6, label: "Above Average" },
  C: { min: 50, points: 5, label: "Average" },
  D: { min: 45, points: 4, label: "Pass" },
  F: { min: 0, points: 0, label: "Fail" },
};

export const PRIORITY_COLORS = {
  normal: "bg-gray-100 text-gray-700",
  important: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-800",
};

export const STATUS_COLORS = {
  submitted: "bg-blue-100 text-blue-800",
  evaluated: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  resubmit: "bg-red-100 text-red-800",
  pass: "bg-green-100 text-green-800",
  fail: "bg-red-100 text-red-800",
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
};

export const TICKET_CATEGORIES = [
  { value: "academic", label: "Academic" },
  { value: "attendance", label: "Attendance" },
  { value: "result", label: "Result" },
  { value: "fee", label: "Fee" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DESIGNATION_OPTIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "HOD",
  "Dean",
];

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const SUBJECT_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "elective", label: "Elective" },
];