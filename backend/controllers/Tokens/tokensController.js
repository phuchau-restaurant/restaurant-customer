// backend/controllers/Tokens/tokensController.js
import jwt from 'jsonwebtoken';

class TokensController {
  /**
   * Verify QR Token
   * POST /api/tokens/verify-qr
   */
  verifyQRToken = async (req, res, next) => {
    try {
      
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
        });
      }

      // Verify JWT token with secret
      const secret = process.env.QR_SECRET;
      
      try {
        const decoded = jwt.verify(token, secret);
        
        // Check if token has expired
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
          return res.status(401).json({
            success: false,
            message: 'QR code đã hết hạn. Vui lòng quét mã QR mới.',
            code: 'TOKEN_EXPIRED',
          });
        }

        // Token is valid, return decoded payload
        return res.status(200).json({
          success: true,
          message: 'Token is valid',
          data: {
            tableId: decoded.tableId,
            tenantId: decoded.tenantId,
            tableNumber: decoded.tableNumber || `Bàn ${decoded.tableId}`,
          },
        });
      } catch (jwtError) {
        // JWT verification failed
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'QR code đã hết hạn. Vui lòng quét mã QR mới.',
            code: 'TOKEN_EXPIRED',
          });
        }

        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'QR code không hợp lệ. Vui lòng quét mã QR từ nhà hàng.',
            code: 'INVALID_TOKEN',
          });
        }

        throw jwtError;
      }
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi xác thực token',
      });
    }
  };
}

export default TokensController;
