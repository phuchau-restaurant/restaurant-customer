import express from "express";
import { adminController } from "../containers/adminContainer.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Bắt buộc có TenantID và phải đăng nhập
router.use(tenantMiddleware);
router.use(authMiddleware);

// Tạo QR code cho bàn (chỉ admin)
router.post("/tables/:id/qr/generate", adminController.generateTableQR);

// Download QR code (PNG hoặc PDF)
router.get("/tables/:id/qr/download", adminController.downloadTableQR);

// Xác thực QR token (public route cho customer)
router.post("/qr/verify", adminController.verifyQRToken);

export default router;
