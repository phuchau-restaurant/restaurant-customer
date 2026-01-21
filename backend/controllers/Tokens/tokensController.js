// backend/controllers/Tokens/tokensController.js
import jwt from 'jsonwebtoken';
import { TablesRepository } from '../../repositories/implementation/TablesRepository.js';

class TokensController {
  constructor() {
    this.tablesRepository = new TablesRepository();
  }

  /**
   * Verify QR Token
   * POST /api/tokens/verify-qr
   * 
   * Kiểm tra:
   * 1. JWT signature hợp lệ
   * 2. JWT chưa hết hạn
   * 3. qrToken trong JWT khớp với qrToken trong database (quan trọng!)
   * 4. Bàn đang active
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
      
      let decoded;
      try {
        decoded = jwt.verify(token, secret);
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
        
      // Check if token has expired (manual check for expiresAt field)
      if (decoded.expiresAt) {
        const expiresAt = new Date(decoded.expiresAt);
        if (new Date() > expiresAt) {
          return res.status(401).json({
            success: false,
            message: 'QR code đã hết hạn. Vui lòng quét mã QR mới.',
            code: 'TOKEN_EXPIRED',
          });
        }
      }

      // ⚠️ QUAN TRỌNG: Kiểm tra qrToken với database
      // Đảm bảo mã QR cũ sẽ bị vô hiệu hóa khi admin tạo mã mới
      const table = await this.tablesRepository.getByIdAndTenant(
        decoded.tableId,
        decoded.tenantId
      );

      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Bàn không tồn tại hoặc đã bị xóa.',
          code: 'TABLE_NOT_FOUND',
        });
      }

      // Kiểm tra qrToken có khớp không (token cũ sẽ bị từ chối)
      if (table.qrToken !== decoded.qrToken) {
        console.log('🔴 QR Token mismatch:', {
          tokenQR: decoded.qrToken,
          dbQR: table.qrToken,
          tableId: decoded.tableId,
        });
        return res.status(401).json({
          success: false,
          message: 'Mã QR này đã bị vô hiệu hóa. Vui lòng quét mã QR mới từ nhà hàng.',
          code: 'TOKEN_REVOKED',
        });
      }

      // Kiểm tra bàn có đang active không
      if (table.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Bàn này hiện không hoạt động.',
          code: 'TABLE_INACTIVE',
        });
      }

      // ✅ Token hợp lệ, trả về thông tin
      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          tableId: table.id,
          tenantId: decoded.tenantId,
          tableNumber: table.tableNumber || `Bàn ${table.id}`,
        },
      });

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
