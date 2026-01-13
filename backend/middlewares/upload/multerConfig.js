import multer from "multer";
import path from "path";

// Cấu hình lưu trữ (memory storage để upload trực tiếp lên Supabase)
const storage = multer.memoryStorage();

// File filter để chỉ accept ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (JPEG, PNG, GIF, WebP, BMP)"),
      false
    );
  }
};

// Cấu hình multer
const uploadConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Tối đa 10 files cùng lúc
  },
};

// Middleware cho single file upload
export const uploadSingle = multer(uploadConfig).single("image");

// Middleware cho multiple files upload
export const uploadMultiple = multer(uploadConfig).array("images", 10);

// Error handling middleware cho multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Maximum is 10 files",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message:
          'Unexpected field name. Use "image" for single or "images" for multiple',
      });
    }
  }

  if (error.message.includes("Only image files")) {
    return res.status(400).json({
      message: error.message,
    });
  }

  // Lỗi khác
  return res.status(500).json({
    message: "Upload failed: " + error.message,
  });
};
