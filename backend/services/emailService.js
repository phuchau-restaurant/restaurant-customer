// backend/services/emailService.js
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Email Service - Hỗ trợ cả SMTP và Resend API
 * 
 * Sử dụng Resend API cho cloud platforms (Render, Vercel) vì chúng chặn SMTP connections.
 * Sử dụng SMTP cho local development.
 * 
 * Environment Variables:
 * - EMAIL_PROVIDER: 'resend' hoặc 'smtp' (mặc định: 'resend' nếu có RESEND_API_KEY)
 * - RESEND_API_KEY: API key từ resend.com
 * - RESEND_FROM_EMAIL: Email gửi đi (phải verify domain trên Resend)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS: Cấu hình SMTP
 */
class EmailService {
  constructor() {
    // Xác định provider: ưu tiên Resend nếu có API key
    this.provider = process.env.EMAIL_PROVIDER || 
                    (process.env.RESEND_API_KEY ? 'resend' : 'smtp');
    
    console.log(`📧 Initializing Email Service...`);
    console.log(`   Provider: ${this.provider.toUpperCase()}`);
    
    if (this.provider === 'resend') {
      this._initResend();
    } else {
      this._initSMTP();
    }
  }

  /**
   * Khởi tạo Resend API client
   */
  _initResend() {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not set!');
      throw new Error('RESEND_API_KEY environment variable is required for Resend provider');
    }
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    console.log(`   API Key: ✓ Set`);
    console.log(`   From Email: ${this.fromEmail}`);
  }

  /**
   * Khởi tạo SMTP transporter
   */
  _initSMTP() {
    const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    const isSecure = smtpPort === 465;
    
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
    console.log(`   SMTP Port: ${smtpPort}`);
    console.log(`   Secure: ${isSecure}`);
    console.log(`   User: ${process.env.SMTP_USER ? '✓ Set' : '✗ Not Set'}`);
    console.log(`   Pass: ${process.env.SMTP_PASS ? '✓ Set' : '✗ Not Set'}`);
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });
    
    this.fromEmail = process.env.SMTP_USER;
  }

  /**
   * Tạo HTML template cho OTP email
   */
  _getOTPEmailTemplate(otp, fullName) {
    return `
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
    `;
  }

  /**
   * Tạo HTML template cho Password Reset email
   */
  _getPasswordResetTemplate(otp, fullName) {
    return `
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
    `;
  }

  /**
   * Gửi email qua Resend API
   */
  async _sendViaResend(to, subject, html) {
    console.log(`📤 [Resend] Sending email to: ${to}`);
    
    try {
      const { data, error } = await this.resend.emails.send({
        from: `Restaurant System <${this.fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error('❌ [Resend] Error:', error);
        throw new Error(error.message);
      }

      console.log('✅ [Resend] Email sent successfully!');
      console.log(`   ID: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('❌ [Resend] Failed to send email:');
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gửi email qua SMTP
   */
  async _sendViaSMTP(to, subject, html) {
    console.log(`📤 [SMTP] Sending email to: ${to}`);
    
    const mailOptions = {
      from: `"Restaurant System" <${this.fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [SMTP] Email sent successfully!');
      console.log(`   Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [SMTP] Failed to send email:');
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gửi email (tự động chọn provider)
   */
  async _sendEmail(to, subject, html) {
    try {
      if (this.provider === 'resend') {
        return await this._sendViaResend(to, subject, html);
      } else {
        return await this._sendViaSMTP(to, subject, html);
      }
    } catch (error) {
      // Xử lý lỗi và trả về message thân thiện
      let userMessage = 'Không thể gửi email. Vui lòng thử lại sau.';
      
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        userMessage = 'Không thể kết nối đến mail server. Vui lòng thử lại sau.';
      } else if (error.code === 'EAUTH') {
        userMessage = 'Lỗi xác thực email server. Vui lòng liên hệ quản trị viên.';
      } else if (error.message?.includes('Invalid API Key')) {
        userMessage = 'Lỗi cấu hình email service. Vui lòng liên hệ quản trị viên.';
      }
      
      throw new Error(userMessage);
    }
  }

  /**
   * Gửi OTP verification email
   * @param {string} email - Email người nhận
   * @param {string} otp - OTP code (6 số)
   * @param {string} fullName - Tên người nhận
   */
  async sendOTPEmail(email, otp, fullName) {
    const html = this._getOTPEmailTemplate(otp, fullName);
    return await this._sendEmail(email, 'Xác thực tài khoản - Mã OTP', html);
  }

  /**
   * Gửi Email Khôi phục mật khẩu
   */
  async sendPasswordResetEmail(email, otp, fullName) {
    const html = this._getPasswordResetTemplate(otp, fullName);
    return await this._sendEmail(email, 'Yêu cầu đặt lại mật khẩu', html);
  }

  /**
   * Test email connection
   */
  async verifyConnection() {
    if (this.provider === 'resend') {
      console.log('✅ Resend API - No connection verification needed');
      return true;
    }
    
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
