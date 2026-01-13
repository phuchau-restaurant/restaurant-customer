// backend/services/emailService.js
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Cấu hình SMTP transporter
    // Bạn có thể thay đổi theo email service của mình (Gmail, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Email của bạn
        pass: process.env.SMTP_PASS, // App password hoặc password email
      },
    });
  }

  /**
   * Gửi OTP verification email
   * @param {string} email - Email người nhận
   * @param {string} otp - OTP code (6 số)
   * @param {string} fullName - Tên người nhận
   */
  async sendOTPEmail(email, otp, fullName) {
    const mailOptions = {
      from: `"Restaurant System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Xác thực tài khoản - Mã OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #f97316; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📌 Xác Thực Tài Khoản</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi!</p>
              <p>Vui lòng sử dụng mã OTP dưới đây để hoàn tất đăng ký:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin-top: 10px; color: #666;">Mã này có hiệu lực trong <strong>10 phút</strong></p>
              </div>
              
              <div class="footer">
                <p>© 2026 Restaurant System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Gửi Email Khôi phục mật khẩu
   */
  async sendPasswordResetEmail(email, otp, fullName) {
    const mailOptions = {
      from: `"Restaurant System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu', // Tiêu đề khác biệt
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { background: #fee2e2; color: #991b1b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background: white; }
            .otp-box { background: #fef2f2; border: 2px dashed #ef4444; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; }
            .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px; margin: 20px 0; font-size: 14px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔐 Khôi Phục Mật Khẩu</h2>
            </div>
            <div class="content">
              <p>Xin chào <strong>${fullName}</strong>,</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin-top: 5px; font-size: 12px; color: #7f1d1d;">Mã OTP có hiệu lực trong 10 phút</p>
              </div>

              <div class="warning">
                <strong>⚠️ Cảnh báo:</strong> Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
              </div>
              
              <p>Cảm ơn,<br/>Đội ngũ hỗ trợ</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Reset Password Email sent:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send reset email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Test email connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();
