import express from "express";
import paymentController from "../controllers/Payment/paymentController.js";
import { tenantMiddleware } from "../middlewares/tenantMiddleware.js";

const router = express.Router();

router.use(tenantMiddleware);

// Tạo link/QR thanh toán
router.post("/momo/create", paymentController.createPaymentUrl);

// Webhook nhận kết quả (IPN)
router.post("/momo/ipn", paymentController.handleMomoIPN);

// API Giả lập test (Dev only)
router.post("/momo/simulate", paymentController.simulateSuccess);

export default router;
