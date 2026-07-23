import { GRADE_SCALE, ATTENDANCE_THRESHOLD } from "./constants";

// ─── DATE / TIME  (zero external dependencies — native Intl API) ──────────────

/** "15 Jan 2024" */
export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

/** "15 Jan 2024, 03:45 PM" */
export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

/** "2h ago", "3d ago", "just now" */
export const timeAgo = (date) => {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date);
};

/** true if deadline has already passed */
export const isDeadlinePassed = (deadline) =>
  deadline ? new Date(deadline) < new Date() : false;

/** true if deadline is within the next 48 hours (and not yet passed) */
export const isDeadlineNear = (deadline) => {
  if (!deadline) return false;
  const diff = new Date(deadline) - Date.now();
  return diff > 0 && diff <= 48 * 3600 * 1000;
};

/** Days remaining until a date — negative means overdue */
export const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - Date.now()) / 86400000);
};

// ─── ATTENDANCE ────────────────────────────────────────────────────────────────

/** Tailwind text-colour class based on attendance % */
export const getAttendanceColor = (pct) => {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 60) return "text-amber-600";
  return "text-red-600";
};

/** Badge CSS class based on attendance % */
export const getAttendanceBadgeClass = (pct) => {
  if (pct >= 75) return "badge-success";
  if (pct >= 60) return "badge-warning";
  return "badge-danger";
};

/**
 * How many consecutive classes must a student attend to reach the threshold?
 * Returns { canRecover, classesNeeded, totalAfter }
 */
export const predictAttendanceShortage = (attended, total, remainingClasses = 0) => {
  const threshold = ATTENDANCE_THRESHOLD / 100;
  if (attended / total >= threshold) return { canRecover: true, classesNeeded: 0, totalAfter: total };
  const needed = Math.ceil((threshold * total - attended) / (1 - threshold));
  return {
    canRecover: remainingClasses === 0 || needed <= remainingClasses,
    classesNeeded: needed,
    totalAfter: total + needed,
  };
};

// ─── GRADES ────────────────────────────────────────────────────────────────────

/** Convert percentage → { grade, label, gradePoints } */
export const percentToGrade = (pct) => {
  for (const item of GRADE_SCALE) {
    if (pct >= item.minPercent) return item;
  }
  return GRADE_SCALE[GRADE_SCALE.length - 1];
};

/** Tailwind colour class for a grade letter */
export const getGradeColor = (grade) => {
  const map = {
    O: "text-emerald-600", "A+": "text-blue-600", A: "text-indigo-600",
    "B+": "text-purple-600", B: "text-amber-600", C: "text-orange-500",
    D: "text-red-500", F: "text-red-700",
  };
  return map[grade] || "text-gray-600";
};

/** percentage from marks */
export const calculatePercentage = (obtained, max) =>
  max ? Math.min(100, (obtained / max) * 100) : 0;

/** SGPA from subjects array [{ gradePoints, credits }] */
export const calculateSGPA = (subjects = []) => {
  const totalCredits   = subjects.reduce((s, sub) => s + (sub.credits || 0), 0);
  const weightedPoints = subjects.reduce((s, sub) => s + (sub.gradePoints || 0) * (sub.credits || 0), 0);
  return totalCredits > 0 ? +(weightedPoints / totalCredits).toFixed(2) : 0;
};

// ─── STRING / UI ───────────────────────────────────────────────────────────────

/** Truncate with ellipsis */
export const truncate = (str, length = 50) =>
  str && str.length > length ? str.slice(0, length) + "…" : str || "";

/** Initials (up to 2 chars) from a full name */
export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Deterministic Tailwind bg-colour from a name string */
export const generateAvatarColor = (name = "") => {
  const colours = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500",  "bg-cyan-500",  "bg-fuchsia-500", "bg-teal-500",
    "bg-indigo-500","bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colours[Math.abs(hash) % colours.length];
};

/** Human-readable file size */
export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024)       return bytes + " B";
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(1) + " GB";
};

/** Emoji icon for a file extension */
export const getFileIcon = (ext = "") => {
  const map = {
    pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊",
    ppt: "📑", pptx: "📑", zip: "🗜️", rar: "🗜️",
    jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", webp: "🖼️",
    mp4: "🎬", avi: "🎬", mov: "🎬", mp3: "🎵", wav: "🎵",
    txt: "📃", csv: "📊", py: "🐍", js: "📜", ts: "📜",
  };
  return map[ext.toLowerCase()] || "📎";
};

// ─── NUMBER ────────────────────────────────────────────────────────────────────

/** Indian currency format → "₹45,000" */
export const formatCurrency = (amount) => {
  if (amount == null) return "—";
  return "₹" + Number(amount).toLocaleString("en-IN");
};

/** Clamp a value between min and max */
export const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

// ─── PERFORMANCE ───────────────────────────────────────────────────────────────

/** Standard debounce */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ─── RISK ──────────────────────────────────────────────────────────────────────

/** Tailwind classes for AI risk level */
export const getRiskLevelColor = (level) => {
  switch (level) {
    case "high":   return "text-red-600 bg-red-50 border-red-200";
    case "medium": return "text-amber-600 bg-amber-50 border-amber-200";
    case "low":    return "text-emerald-600 bg-emerald-50 border-emerald-200";
    default:       return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

// ─── VALIDATION ────────────────────────────────────────────────────────────────

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) =>
  /^[+]?[\d\s\-().]{7,15}$/.test(phone);

export const isStrongPassword = (pw) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

// ─── LOCAL STORAGE ─────────────────────────────────────────────────────────────

export const storage = {
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
};

// ─── QUERY STRING ──────────────────────────────────────────────────────────────

export const buildQuery = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.append(k, v);
  });
  return q.toString() ? "?" + q.toString() : "";
};

// ─── COLOUR ────────────────────────────────────────────────────────────────────

/** Hex colour from a 0-1 ratio (red → amber → green) */
export const ratioToColor = (ratio) => {
  if (ratio >= 0.75) return "#10b981";
  if (ratio >= 0.60) return "#f59e0b";
  return "#ef4444";
};