# Webhook Setup Guide - Cross-Backend Notifications

## 🎯 Mục đích

Khi **Customer Backend** và **Staff Backend** deploy riêng biệt, socket events không thể chia sẻ trực tiếp.

**Giải pháp**: Customer Backend gửi **HTTP Webhook** đến Staff Backend khi có đơn hàng mới.

---

## 📋 Cách hoạt động

```
Customer tạo đơn
    ↓
Customer Backend
    ├─→ Lưu vào Database
    ├─→ Emit Socket (cho waiters kết nối đến Customer Backend)
    └─→ Gửi HTTP Webhook đến Staff Backend
            ↓
    Staff Backend nhận webhook
            ↓
    Staff Backend emit socket đến Staff App
            ↓
    Waiter nhận thông báo realtime ✅
```

---

## ⚙️ Cấu hình

### 1. Customer Backend (Restaurant-customer)

Cập nhật file `.env`:

```env
STAFF_BACKEND_URL=https://restaurant-staff.onrender.com
```

**Lưu ý**:

- URL phải là URL **thực tế** của Staff Backend (không có `/` ở cuối)
- Nếu để giá trị mặc định `https://your-staff-backend-url.onrender.com`, webhook sẽ **tự động bị disable**

### 2. Staff Backend (Restaurant-staff)

Tạo webhook endpoint để nhận thông báo:

**File: `routers/webhooks.routes.js`** (Tạo mới)

```javascript
import express from "express";
import { getIO } from "../configs/socket.js";

const router = express.Router();

// POST /api/webhooks/new-order
router.post("/new-order", (req, res) => {
  try {
    const { event, data, timestamp } = req.body;

    // Validate webhook source
    const source = req.headers["x-webhook-source"];
    if (source !== "customer-backend") {
      return res.status(403).json({ error: "Invalid webhook source" });
    }

    console.log("📨 Webhook received:", event, data);

    // Emit socket event to staff app
    const io = getIO();
    io.to("waiters").emit("order:created", data);

    res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/webhooks/order-submitted
router.post("/order-submitted", (req, res) => {
  try {
    const { event, data, timestamp } = req.body;

    const source = req.headers["x-webhook-source"];
    if (source !== "customer-backend") {
      return res.status(403).json({ error: "Invalid webhook source" });
    }

    console.log("📨 Webhook received:", event, data);

    const io = getIO();
    io.to("waiters").emit("order:submitted", data);

    res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**File: `server.js`** (Thêm route)

```javascript
import webhooksRoutes from "./routers/webhooks.routes.js";

// ... existing code ...

app.use("/api/webhooks", webhooksRoutes);
```

---

## 🧪 Testing

### 1. Kiểm tra Staff Backend có hoạt động không

```bash
curl https://restaurant-staff.onrender.com/health
```

Kết quả mong đợi: HTTP 200

### 2. Test webhook manually

```bash
curl -X POST https://restaurant-staff.onrender.com/api/webhooks/new-order \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: customer-backend" \
  -d '{
    "event": "order:created",
    "data": {
      "orderId": 123,
      "tableId": 5,
      "tableNumber": "A5",
      "displayOrder": "ORD-123456",
      "totalAmount": 250000,
      "itemCount": 3,
      "tenantId": "test-tenant",
      "status": "Unsubmit",
      "timestamp": "2026-01-17T10:30:00.000Z"
    },
    "timestamp": "2026-01-17T10:30:00.000Z"
  }'
```

### 3. Kiểm tra logs

**Customer Backend logs:**

```
✅ Socket: Emitted order:created event to waiters
✅ Webhook: Notified staff backend about new order 123
```

**Staff Backend logs:**

```
📨 Webhook received: order:created { orderId: 123, ... }
```

---

## 🔧 Troubleshooting

### Webhook không hoạt động

**Kiểm tra:**

1. **STAFF_BACKEND_URL đúng chưa?**

   ```bash
   echo $STAFF_BACKEND_URL
   ```

2. **Staff Backend có endpoint `/api/webhooks/new-order` chưa?**

   ```bash
   curl -I https://your-staff-backend.onrender.com/api/webhooks/new-order
   ```

3. **Kiểm tra logs Customer Backend:**

   - Có thấy message `✅ Webhook: Notified staff backend` không?
   - Có lỗi `❌ Webhook failed` không?

4. **Kiểm tra network:**
   - Staff Backend có firewall block request từ Customer Backend không?
   - CORS có được config đúng không?

### Webhook bị disable

Nếu thấy log:

```
⚠️  Webhook disabled: STAFF_BACKEND_URL not configured
```

**Nguyên nhân**:

- `STAFF_BACKEND_URL` không được set
- Hoặc đang để giá trị mặc định `https://your-staff-backend-url.onrender.com`

**Giải pháp**: Cập nhật `.env` với URL thực tế

---

## 🚀 Deployment

### Render.com

1. **Customer Backend**:

   - Thêm Environment Variable: `STAFF_BACKEND_URL`
   - Value: URL của Staff Backend (ví dụ: `https://restaurant-staff-abc.onrender.com`)

2. **Staff Backend**:

   - Deploy code có webhook endpoints
   - Restart service

3. **Test**:
   - Customer tạo đơn
   - Kiểm tra Staff app có nhận notification không

---

## 📊 So sánh với Redis Adapter

| Tiêu chí        | Webhook                   | Redis Adapter                 |
| --------------- | ------------------------- | ----------------------------- |
| **Độ phức tạp** | Thấp ⭐                   | Cao ⭐⭐⭐                    |
| **Chi phí**     | Miễn phí                  | Cần Redis service (~$3/tháng) |
| **Realtime**    | Gần realtime (~100-500ms) | Realtime (~10-50ms)           |
| **Reliability** | HTTP retry có thể thêm    | Native trong Socket.IO        |
| **Phù hợp**     | 2 backends riêng biệt     | Nhiều instances cùng backend  |

**Khuyến nghị**:

- Dùng **Webhook** cho hầu hết trường hợp (đơn giản, free)
- Dùng **Redis Adapter** nếu cần performance cực cao hoặc có nhiều backends

---

## 📝 Notes

- Webhook chạy **bất đồng bộ** (async/await) để không block việc tạo order
- Nếu webhook fail, order vẫn được tạo thành công
- Staff app vẫn nhận được thông báo qua socket nếu kết nối đến Customer Backend
- Có thể thêm retry logic nếu cần độ tin cậy cao hơn

---

## 🔗 Related Files

- `backend/services/webhookService.js` - Webhook sender
- `backend/services/Orders/ordersService.js` - Gọi webhook khi tạo order
- `backend/.env` - Cấu hình STAFF_BACKEND_URL
