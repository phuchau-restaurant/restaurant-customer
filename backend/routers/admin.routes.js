import express from "express";
import { adminController } from "../containers/adminContainer.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Xác thực QR token (public route cho customer - KHÔNG CẦN AUTH)
router.post("/qr/verify", adminController.verifyQRToken);

// Bắt buộc có TenantID và phải đăng nhập cho các routes còn lại
router.use(tenantMiddleware);
router.use(authMiddleware);

// Tạo QR code cho bàn (chỉ admin)
router.post("/tables/:id/qr/generate", adminController.generateTableQR);

// Download QR code (PNG hoặc PDF)
router.get("/tables/:id/qr/download", adminController.downloadTableQR);

// Download tất cả QR codes (ZIP chứa PNG + PDF)
router.get("/tables/qr/download-all", adminController.downloadAllTableQR);

export default router;
