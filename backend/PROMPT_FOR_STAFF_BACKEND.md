# PROMPT CHI TIẾT: Thêm Webhook vào Restaurant-staff Backend

Copy toàn bộ prompt này và làm theo từng bước.

---

## 🎯 MỤC TIÊU

Thêm webhook endpoint vào Restaurant-staff backend để nhận thông báo từ Restaurant-customer backend khi có đơn hàng mới.

---

## 📋 CÁC BƯỚC THỰC HIỆN

### **BƯỚC 1: Tạo file webhook routes**

Trong dự án **Restaurant-staff**, tạo file mới:

**Đường dẫn:** `backend/routers/webhooks.routes.js`

**Nội dung:**

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

    // Emit socket event to all waiters
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
 * Nhận thông báo khi customer submit đơn
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

### **BƯỚC 2: Import webhook routes vào server.js**

Mở file: `backend/server.js`

**2.1. Thêm import ở đầu file (cùng với các import routes khác):**

```javascript
// Tìm dòng import các routes, ví dụ:
import ordersRoutes from "./routers/orders.routes.js";
import categoriesRoutes from "./routers/categories.routes.js";
// ... các routes khác ...

// THÊM DÒNG NÀY:
import webhooksRoutes from "./routers/webhooks.routes.js";
```

**2.2. Thêm route vào app (sau các routes khác, TRƯỚC error middleware):**

Tìm phần khai báo routes, thường có dạng:

```javascript
// Routes
app.use("/api/orders", ordersRoutes);
app.use("/api/categories", categoriesRoutes);
// ... các routes khác ...

// THÊM DÒNG NÀY (TRƯỚC error middleware):
app.use("/api/webhooks", webhooksRoutes);

// Error handling middleware (phải để cuối cùng)
app.use(errorMiddleware);
```

**LƯU Ý QUAN TRỌNG:**

- Webhook routes KHÔNG cần `tenantMiddleware` hay `authMiddleware`
- Đặt SAU các routes khác nhưng TRƯỚC error middleware

---

### **BƯỚC 3: (Optional) Thêm health check endpoint**

Nếu chưa có, thêm health check để Customer Backend có thể ping:

Trong `server.js`, thêm trước các routes:

```javascript
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "restaurant-staff-backend",
    timestamp: new Date().toISOString(),
  });
});
```

---

### **BƯỚC 4: Kiểm tra cấu hình Socket.IO**

Đảm bảo file `backend/configs/socket.js` có:

```javascript
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Join waiter room
  socket.on("join_waiter", (waiterId) => {
    socket.join("waiters");
    console.log(`Socket ${socket.id} joined waiters room`);
  });

  // ... other socket events ...
});
```

Nếu chưa có event `join_waiter`, thêm vào.

---

### **BƯỚC 5: Restart Staff Backend**

```bash
# Trong terminal đang chạy Staff Backend
# Nhấn Ctrl+C để stop

# Chạy lại:
npm run dev
```

**Kiểm tra log có dòng:**

```
Server is running on port 3000 (hoặc port khác)
```

---

### **BƯỚC 6: Test webhook endpoint**

Mở terminal mới và test:

```bash
curl -X POST http://localhost:3000/api/webhooks/new-order \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: customer-backend" \
  -H "X-Tenant-ID: test-tenant" \
  -d "{\"event\":\"order:created\",\"data\":{\"orderId\":999,\"tableNumber\":\"TEST-1\",\"displayOrder\":\"ORD-999\",\"totalAmount\":100000,\"itemCount\":2,\"tenantId\":\"test-tenant\",\"status\":\"Unsubmit\",\"timestamp\":\"2026-01-17T10:00:00.000Z\"},\"timestamp\":\"2026-01-17T10:00:00.000Z\"}"
```

**Kết quả mong đợi:**

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "orderId": 999
}
```

**Logs trong Staff Backend terminal:**

```
📨 Webhook received: NEW ORDER { orderId: 999, tableNumber: 'TEST-1', ... }
✅ Socket emitted to waiters: 999
```

---

### **BƯỚC 7: Cập nhật Customer Backend .env**

Quay lại dự án **Restaurant-customer**, mở file `backend/.env`:

**Đảm bảo có dòng:**

```env
STAFF_BACKEND_URL=http://localhost:3000
```

**Lưu ý:**

- Port phải khớp với port Staff Backend đang chạy
- Nếu Staff chạy port 3001, đổi thành `http://localhost:3001`
- KHÔNG có dấu `/` ở cuối

---

### **BƯỚC 8: Restart Customer Backend**

```bash
# Trong terminal đang chạy Customer Backend
# Nhấn Ctrl+C để stop

# Chạy lại:
npm run dev
```

---

### **BƯỚC 9: Test flow hoàn chỉnh**

**9.1. Chạy đủ 4 services:**

```
✅ Customer Backend:  http://localhost:3001 (hoặc 3000)
✅ Staff Backend:     http://localhost:3000 (hoặc 3001)
✅ Customer Frontend: http://localhost:5173
✅ Staff Frontend:    http://localhost:5174
```

**9.2. Test tạo đơn:**

1. Mở **Customer Frontend** (http://localhost:5173)
2. Quét QR code hoặc nhập tableId
3. Thêm món ăn vào giỏ
4. Bấm "Đặt món" (Submit Order)

**9.3. Kiểm tra logs:**

**Customer Backend log:**

```
[2026-01-17T00:38:00.335Z] POST /api/orders
✅ Socket: Emitted order:created event to waiters
✅ Webhook: Notified staff backend about new order 123
```

**Staff Backend log:**

```
📨 Webhook received: NEW ORDER { orderId: 123, tableNumber: 'A5', ... }
✅ Socket emitted to waiters: 123
```

**9.4. Kiểm tra Staff Frontend:**

- Mở Staff app
- Đăng nhập với tài khoản waiter
- Kiểm tra có thông báo đơn mới không
- Kiểm tra danh sách đơn có order mới không

---

## ✅ CHECKLIST

Đánh dấu khi hoàn thành:

- [ ] Tạo file `backend/routers/webhooks.routes.js` trong Staff Backend
- [ ] Import webhook routes vào `server.js`
- [ ] Thêm `app.use("/api/webhooks", webhooksRoutes)` vào server.js
- [ ] (Optional) Thêm `/health` endpoint
- [ ] Restart Staff Backend
- [ ] Test webhook bằng curl - nhận response 200
- [ ] Cập nhật `STAFF_BACKEND_URL` trong Customer Backend .env
- [ ] Restart Customer Backend
- [ ] Test tạo đơn từ Customer Frontend
- [ ] Xác nhận logs hiển thị webhook success
- [ ] Xác nhận Staff Frontend nhận thông báo

---

## 🔧 TROUBLESHOOTING

### Lỗi 1: Cannot POST /api/webhooks/new-order

**Nguyên nhân:**

- Quên thêm `app.use("/api/webhooks", webhooksRoutes)` trong server.js
- Import sai đường dẫn
- Chưa restart server

**Giải pháp:**

- Kiểm tra lại BƯỚC 2
- Restart Staff Backend

---

### Lỗi 2: Socket.io not initialized

**Nguyên nhân:**

- `initSocket()` chưa được gọi trong server.js
- Socket chưa khởi tạo xong

**Giải pháp:**

```javascript
// Trong server.js, đảm bảo có:
import { initSocket } from "./configs/socket.js";
import http from "http";

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Lỗi 3: Webhook timeout/không response

**Nguyên nhân:**

- Staff Backend không chạy
- Port sai
- STAFF_BACKEND_URL sai

**Giải pháp:**

- Kiểm tra Staff Backend có chạy không
- Kiểm tra port trong .env khớp với port thực tế
- Test bằng curl trực tiếp

---

### Lỗi 4: Staff Frontend không nhận notification

**Nguyên nhân:**

- Staff Frontend chưa kết nối socket
- Chưa join room "waiters"
- Socket URL sai

**Giải pháp:**

```javascript
// Trong Staff Frontend, đảm bảo có:
import io from "socket.io-client";

const socket = io(BACKEND_URL);

socket.on("connect", () => {
  socket.emit("join_waiter", waiterId);
});

socket.on("order:created", (data) => {
  console.log("New order:", data);
  showNotification(data);
});
```

---

## 📊 KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành, khi customer tạo đơn:

1. ✅ Customer Backend tạo order trong DB
2. ✅ Customer Backend emit socket đến room "waiters"
3. ✅ Customer Backend gửi HTTP POST đến Staff Backend
4. ✅ Staff Backend nhận webhook, return 200 OK
5. ✅ Staff Backend emit socket đến Staff Frontend
6. ✅ Staff Frontend hiển thị notification "Đơn mới từ bàn X"
7. ✅ Staff Frontend cập nhật danh sách đơn hàng

---

## 🚀 DEPLOYMENT (Sau khi test local thành công)

### Staff Backend trên Render:

**File cần commit:**

- `backend/routers/webhooks.routes.js` (file mới)
- `backend/server.js` (đã sửa)

**Commands:**

```bash
cd Restaurant-staff
git add backend/routers/webhooks.routes.js
git add backend/server.js
git commit -m "Add webhook endpoint to receive order notifications from customer backend"
git push origin main
```

Render sẽ tự động deploy.

### Customer Backend trên Render:

**Environment Variable:**

```
STAFF_BACKEND_URL=https://restaurant-staff-xyz.onrender.com
```

(Thay bằng URL thực tế của Staff Backend trên Render)

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:

1. **Logs của cả 2 backends** - Có error message gì không?
2. **Network tab trong Browser DevTools** - Request có được gửi không?
3. **Socket connection status** - Frontend có kết nối được socket không?
4. **Port conflicts** - 2 backends có chạy trên port khác nhau không?

Cung cấp log chi tiết để debug.

---

**Chúc bạn thành công! 🎉**
