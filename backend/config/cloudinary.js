const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `college_management/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: "auto",
    },
  });
};

const assignmentStorage = createStorage("assignments", ["pdf", "docx", "zip", "png", "jpg"]);
const materialStorage = createStorage("study_material", ["pdf", "ppt", "pptx", "mp4", "png", "jpg"]);
const profileStorage = createStorage("profiles", ["png", "jpg", "jpeg", "webp"]);
const noticeStorage = createStorage("notices", ["pdf", "png", "jpg", "jpeg"]);
const certificateStorage = createStorage("certificates", ["pdf", "png", "jpg", "jpeg"]);

const uploadAssignment = multer({ storage: assignmentStorage });
const uploadMaterial = multer({ storage: materialStorage });
const uploadProfile = multer({ storage: profileStorage });
const uploadNotice = multer({ storage: noticeStorage });
const uploadCertificate = multer({ storage: certificateStorage });

module.exports = {
  cloudinary,
  uploadAssignment,
  uploadMaterial,
  uploadProfile,
  uploadNotice,
  uploadCertificate,
};