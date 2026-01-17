# Staff Backend - Webhook Implementation Guide

## 📝 Tổng quan

File này chứa code mẫu cần thêm vào **Restaurant-staff** backend để nhận webhook từ Restaurant-customer.

---

## 🔧 Implementation

### 1. Tạo file `routers/webhooks.routes.js`

```javascript
import express from "express";
import { getIO } from "../configs/socket.js";

const router = express.Router();

/**
 * POST /api/webhooks/new-order
 * Nhận thông báo từ Customer Backend khi có đơn hàng mới
 */
router.post("/new-order", (req, res) => {
  try {
    const { event, data, timestamp } = req.body;

    // Validate webhook source để tránh spam
    const source = req.headers["x-webhook-source"];
    if (source !== "customer-backend") {
      console.warn("⚠️  Invalid webhook source:", source);
      return res.status(403).json({
        success: false,
        error: "Invalid webhook source",
      });
    }

    // Validate tenant ID (security)
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) {
      console.warn("⚠️  Missing tenant ID in webhook");
      return res.status(400).json({
        success: false,
        error: "Missing tenant ID",
      });
    }

    console.log("📨 Webhook received: NEW ORDER", {
      orderId: data.orderId,
      tableNumber: data.tableNumber,
      totalAmount: data.totalAmount,
      tenantId: tenantId,
    });

    // Emit socket event to all waiters in this tenant
    const io = getIO();
    io.to("waiters").emit("order:created", data);

    console.log("✅ Socket emitted to waiters:", data.orderId);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      orderId: data.orderId,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/webhooks/order-submitted
 * Nhận thông báo khi customer submit đơn (UNSUBMIT -> PENDING)
 */
router.post("/order-submitted", (req, res) => {
  try {
    const { event, data, timestamp } = req.body;

    const source = req.headers["x-webhook-source"];
    if (source !== "customer-backend") {
      return res.status(403).json({
        success: false,
        error: "Invalid webhook source",
      });
    }

    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Missing tenant ID",
      });
    }

    console.log("📨 Webhook received: ORDER SUBMITTED", {
      orderId: data.orderId,
      tableNumber: data.tableNumber,
      status: data.status,
    });

    const io = getIO();
    io.to("waiters").emit("order:submitted", data);

    console.log("✅ Socket emitted to waiters: order submitted", data.orderId);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      orderId: data.orderId,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

---

### 2. Cập nhật `server.js`

Thêm webhook routes vào server:

```javascript
// ... existing imports ...
import webhooksRoutes from "./routers/webhooks.routes.js";

// ... existing code ...

// Routes
app.use("/api/orders", ordersRoutes);
app.use("/api/categories", categoriesRoutes);
// ... other routes ...

// Webhook routes (KHÔNG CẦN AUTH MIDDLEWARE)
app.use("/api/webhooks", webhooksRoutes);

// ... rest of the code ...
```

**Lưu ý quan trọng:**

- Webhook routes KHÔNG nên có `tenantMiddleware` hoặc `authMiddleware`
- Xác thực qua header `X-Webhook-Source` và `X-Tenant-ID`
- Đặt **SAU** các routes khác để dễ quản lý

---

### 3. (Optional) Thêm health check endpoint

Để Customer Backend có thể ping kiểm tra kết nối:

```javascript
// Trong server.js
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "restaurant-staff-backend",
    timestamp: new Date().toISOString(),
  });
});
```

---

## 🧪 Testing Local

### 1. Chạy cả 2 backends

**Terminal 1 - Customer Backend:**

```bash
cd Restaurant-customer/backend
npm run dev
# Running on http://localhost:3000
```

**Terminal 2 - Staff Backend:**

```bash
cd Restaurant-staff/backend
npm run dev
# Running on http://localhost:3001
```

### 2. Cập nhật Customer Backend .env

```env
STAFF_BACKEND_URL=http://localhost:3001
```

### 3. Test tạo order

Dùng Postman hoặc curl:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{
    "tableId": 5,
    "customerId": "customer-123",
    "dishes": [
      {
        "dishId": 10,
        "quantity": 2,
        "description": "Phở bò",
        "modifiers": []
      }
    ]
  }'
```

**Kết quả mong đợi:**

**Customer Backend logs:**

```
✅ Socket: Emitted order:created event to waiters
✅ Webhook: Notified staff backend about new order 123
```

**Staff Backend logs:**

```
📨 Webhook received: NEW ORDER { orderId: 123, ... }
✅ Socket emitted to waiters: 123
```

---

## 🚀 Deployment (Render.com)

### 1. Deploy Customer Backend

Environment Variables:

```
STAFF_BACKEND_URL=https://restaurant-staff.onrender.com
```

### 2. Deploy Staff Backend

Đảm bảo code có webhook routes đã được commit và push.

### 3. Kiểm tra kết nối

```bash
# Ping staff backend
curl https://restaurant-staff.onrender.com/health

# Test webhook
curl -X POST https://restaurant-staff.onrender.com/api/webhooks/new-order \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: customer-backend" \
  -H "X-Tenant-ID: test" \
  -d '{
    "event": "order:created",
    "data": {
      "orderId": 999,
      "tableNumber": "TEST-1"
    }
  }'
```

---

## 🔒 Security Considerations

### 1. Webhook Authentication

Hiện tại dùng `X-Webhook-Source` header. Để tăng security, có thể thêm:

```javascript
// Trong webhook route
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-secret-key";
const signature = req.headers["x-webhook-signature"];

// Customer Backend gửi kèm signature
const expectedSignature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest("hex");

if (signature !== expectedSignature) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

### 2. Rate Limiting

Thêm rate limit cho webhook endpoints:

```javascript
import rateLimit from "express-rate-limit";

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // max 100 requests per minute
  message: "Too many webhook requests",
});

app.use("/api/webhooks", webhookLimiter, webhooksRoutes);
```

---

## 📊 Monitoring & Debugging

### Logs cần theo dõi

**Thành công:**

```
📨 Webhook received: NEW ORDER { orderId: 123 }
✅ Socket emitted to waiters: 123
```

**Lỗi phổ biến:**

1. **Invalid webhook source:**

   ```
   ⚠️  Invalid webhook source: undefined
   ```

   → Kiểm tra Customer Backend có gửi header `X-Webhook-Source` không

2. **Missing tenant ID:**

   ```
   ⚠️  Missing tenant ID in webhook
   ```

   → Kiểm tra Customer Backend có gửi header `X-Tenant-ID` không

3. **Socket.IO not initialized:**
   ```
   ❌ Webhook processing error: Socket.io not initialized
   ```
   → Kiểm tra `initSocket()` đã được gọi trong `server.js` chưa

---

## 🔗 Related Documents

- [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) - Hướng dẫn setup trên Customer Backend
- [SOCKET_EVENTS_SUMMARY.md](./SOCKET_EVENTS_SUMMARY.md) - Tài liệu về socket events

---

## 💡 Alternative: Dual Socket Connection

Nếu không muốn dùng webhook, Staff App có thể kết nối socket đến **CẢ HAI** backends:

```javascript
// Staff Frontend
import io from "socket.io-client";

// Connect to Staff Backend (for staff-specific events)
const staffSocket = io(STAFF_BACKEND_URL);

// Connect to Customer Backend (for customer order events)
const customerSocket = io(CUSTOMER_BACKEND_URL);

customerSocket.on("connect", () => {
  customerSocket.emit("join_waiter", waiterId);
});

customerSocket.on("order:created", (data) => {
  console.log("New order from customer:", data);
  showNotification(data);
});
```

**Ưu điểm:**

- Không cần webhook endpoint
- Realtime 100%

**Nhược điểm:**

- Phải quản lý 2 socket connections
- Phức tạp hơn về logic reconnection
