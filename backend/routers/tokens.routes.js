// backend/routers/tokens.routes.js
import express from 'express';
import tokensController from '../containers/tokensContainer.js';

const router = express.Router();

// POST /api/tokens/verify-qr - Verify QR code token
router.post('/verify-qr', tokensController.verifyQRToken);

export default router;
