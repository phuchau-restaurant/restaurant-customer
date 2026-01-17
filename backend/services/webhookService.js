// backend/services/webhookService.js
/**
 * Webhook Service - Gửi thông báo HTTP đến Staff Backend
 * Giải pháp thay thế Redis Adapter cho việc đồng bộ events giữa 2 backends
 */

class WebhookService {
  constructor() {
    this.staffBackendUrl = process.env.STAFF_BACKEND_URL;
    this.enabled =
      !!this.staffBackendUrl &&
      this.staffBackendUrl !== "https://your-staff-backend-url.onrender.com";
  }

  /**
   * Gửi thông báo đơn hàng mới đến Staff Backend
   * @param {Object} orderData - Thông tin đơn hàng
   */
  async notifyNewOrder(orderData) {
    if (!this.enabled) {
      console.log("⚠️  Webhook disabled: STAFF_BACKEND_URL not configured");
      return;
    }

    try {
      const webhookUrl = `${this.staffBackendUrl}/api/webhooks/new-order`;

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Source": "customer-backend",
          "X-Tenant-ID": orderData.tenantId || "",
        },
        body: JSON.stringify({
          event: "order:created",
          data: orderData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log(
          "✅ Webhook: Notified staff backend about new order",
          orderData.orderId
        );
      } else {
        const errorText = await response.text();
        console.error("❌ Webhook failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("❌ Webhook error:", error.message);
      // Không throw error để không ảnh hưởng đến việc tạo order
    }
  }

  /**
   * Gửi thông báo đơn hàng đã submit (customer xác nhận)
   * @param {Object} orderData - Thông tin đơn hàng
   */
  async notifyOrderSubmitted(orderData) {
    if (!this.enabled) {
      console.log("⚠️  Webhook disabled: STAFF_BACKEND_URL not configured");
      return;
    }

    try {
      const webhookUrl = `${this.staffBackendUrl}/api/webhooks/order-submitted`;

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Source": "customer-backend",
          "X-Tenant-ID": orderData.tenantId || "",
        },
        body: JSON.stringify({
          event: "order:submitted",
          data: orderData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        console.log(
          "✅ Webhook: Notified staff backend about order submission",
          orderData.orderId
        );
      } else {
        const errorText = await response.text();
        console.error("❌ Webhook failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("❌ Webhook error:", error.message);
    }
  }

  /**
   * Ping staff backend để kiểm tra kết nối
   */
  async ping() {
    if (!this.enabled) {
      return { success: false, message: "Webhook not configured" };
    }

    try {
      const response = await fetch(`${this.staffBackendUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      return {
        success: response.ok,
        status: response.status,
        url: this.staffBackendUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url: this.staffBackendUrl,
      };
    }
  }
}

// Singleton instance
const webhookService = new WebhookService();

export default webhookService;
