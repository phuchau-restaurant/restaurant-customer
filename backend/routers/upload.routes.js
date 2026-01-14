import express from "express";
import uploadController from "../controllers/Supabase/uploadController.js";
import {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
} from "../middlewares/upload/multerConfig.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

// Apply tenant middleware cho tất cả routes
router.use(tenantMiddleware);

// Single file upload
router.post(
  "/single",
  uploadSingle,
  handleUploadError,
  uploadController.upload
);

// Multiple files upload
router.post(
  "/batch",
  uploadMultiple,
  handleUploadError,
  uploadController.uploadBatch
);

// List files
router.get("/list", uploadController.list);

// Delete file
router.delete("/delete", uploadController.delete);

export default router;
