const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// ─── Ensure upload directory exists ──────────────────────────────────────────
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── General storage (all file types) ────────────────────────────────────────
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// ─── CSV / Excel storage ──────────────────────────────────────────────────────
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `upload_${Date.now()}${path.extname(file.originalname)}`),
});

const csvFilter = (req, file, cb) => {
  const allowed = [".csv", ".xlsx", ".xls"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error("Only CSV and Excel files are allowed"), false);
};

// ─── Exported instances ───────────────────────────────────────────────────────

/** General-purpose uploader — use as: upload.single("file") */
const upload = multer({
  storage: generalStorage,
  limits:  { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

/** CSV/Excel-only uploader */
const uploadCSV = multer({
  storage:    csvStorage,
  fileFilter: csvFilter,
  limits:     { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
module.exports.uploadCSV = uploadCSV;