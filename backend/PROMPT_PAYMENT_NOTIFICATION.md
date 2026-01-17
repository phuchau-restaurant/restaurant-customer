# PROMPT: Thêm Payment Request Webhook & Sound Notification

## 🎯 MỤC TIÊU

Khi customer bấm "Gọi NV Thanh Toán" → Staff app nhận thông báo và phát âm thanh giống như khi có đơn mới.

---

## 📋 CÁC BƯỚC THỰC HIỆN

### **BƯỚC 1: Thêm payment webhook endpoint**

Mở file: `backend/routers/webhooks.routes.js`

**Thêm route mới vào cuối file (trước `export default router`):**

```javascript
/**
 * POST /api/webhooks/payment-request
 * Nhận thông báo khi customer yêu cầu thanh toán
 */
router.post("/payment-request", (req, res) => {
  try {
    const { event, data, timestamp } = req.body;

    // Validate webhook source
    const source = req.headers["x-webhook-source"];
    if (source !== "customer-backend") {
      console.warn("⚠️  Invalid webhook source:", source);
      return res.status(403).json({
        success: false,
        error: "Invalid webhook source",
      });
    }

    // Validate tenant ID
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) {
      console.warn("⚠️  Missing tenant ID in webhook");
      return res.status(400).json({
        success: false,
        error: "Missing tenant ID",
      });
    }

    console.log("💰 Webhook received: PAYMENT REQUEST", {
      requestId: data.requestId,
      tableNumber: data.tableNumber,
      orderId: data.orderId,
      tenantId: tenantId,
    });

    // Emit socket event to all waiters
    const io = getIO();
    io.to("waiters").emit("payment_request", data);

    console.log(
      "✅ Socket emitted to waiters: payment request",
      data.requestId
    );

    res.status(200).json({
      success: true,
      message: "Payment request webhook processed successfully",
      requestId: data.requestId,
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

**File hoàn chỉnh sẽ có 3 routes:**

1. `/new-order` - Đơn hàng mới
2. `/order-submitted` - Đơn đã submit
3. `/payment-request` - Yêu cầu thanh toán ⬅️ MỚI

---

### **BƯỚC 2: Cập nhật Staff Frontend - Socket listener**

Mở file quản lý socket trong Staff Frontend (thường là `socket.js`, `useSocket.js`, hoặc component layout)

**Thêm listener cho payment_request:**

```javascript
// Existing code
socket.on("order:created", (data) => {
  console.log("📦 New order received:", data);
  playNotificationSound(); // Phát âm thanh
  showNotification(`Đơn mới từ bàn ${data.tableNumber}`);
  // ... refresh order list ...
});

// THÊM CODE NÀY:
socket.on("payment_request", (data) => {
  console.log("💰 Payment request received:", data);
  playNotificationSound(); // Phát cùng âm thanh như đơn mới
  showNotification(`Bàn ${data.tableNumber} yêu cầu thanh toán`, "payment");
  // Optional: Highlight bàn cần thanh toán
});
```

---

### **BƯỚC 3: (Optional) Hiển thị notification khác biệt**

Nếu muốn phân biệt notification đơn mới vs thanh toán:

**Option A: Cùng âm thanh, khác UI:**

```javascript
socket.on("payment_request", (data) => {
  playNotificationSound(); // Cùng âm thanh

  showNotification({
    title: "💰 Yêu cầu thanh toán",
    message: `Bàn ${data.tableNumber}`,
    type: "payment", // Khác màu/icon
    orderId: data.orderId,
  });
});
```

**Option B: Riêng âm thanh (nếu cần):**

```javascript
// Tạo function mới
const playPaymentSound = () => {
  const audio = new Audio("/sounds/payment-request.mp3");
  audio.play().catch((err) => console.error("Sound error:", err));
};

socket.on("payment_request", (data) => {
  playPaymentSound(); // Âm thanh riêng cho payment
  showNotification(`💰 Bàn ${data.tableNumber} cần thanh toán`);
});
```

---

### **BƯỚC 4: Test**

**4.1. Restart Staff Backend:**

```bash
# Ctrl+C để stop
npm run dev
```

**4.2. Test webhook bằng curl:**

```bash
curl -X POST http://localhost:3000/api/webhooks/payment-request \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: customer-backend" \
  -H "X-Tenant-ID: test-tenant" \
  -d "{\"event\":\"payment:request\",\"data\":{\"requestId\":\"PAY-123\",\"tableNumber\":\"A5\",\"orderId\":456,\"tableId\":5,\"tenantId\":\"test-tenant\",\"timestamp\":\"2026-01-17T10:00:00.000Z\"},\"timestamp\":\"2026-01-17T10:00:00.000Z\"}"
```

**Kết quả mong đợi:**

**Response:**

```json
{
  "success": true,
  "message": "Payment request webhook processed successfully",
  "requestId": "PAY-123"
}
```

**Staff Backend logs:**

```
💰 Webhook received: PAYMENT REQUEST { requestId: 'PAY-123', ... }
✅ Socket emitted to waiters: payment request PAY-123
```

**4.3. Test thực tế:**

1. Mở **Customer app** → Vào trang đơn hàng
2. Bấm nút **"Gọi NV Thanh Toán"**
3. Kiểm tra **Staff app**:
   - Có thông báo hiện lên không?
   - Có phát âm thanh không?
   - Console có log "💰 Payment request received" không?

---

## 🔍 KIỂM TRA CODE HIỆN TẠI

### Xác định file socket listener trong Staff Frontend:

**Tìm nơi đang listen `order:created`:**

```bash
# Trong folder Staff Frontend
grep -r "order:created" src/
# hoặc
grep -r "socket.on" src/
```

**Các vị trí phổ biến:**

- `src/contexts/SocketContext.jsx`
- `src/hooks/useSocket.js`
- `src/layouts/MainLayout.jsx`
- `src/components/OrderNotification.jsx`

**Thêm listener `payment_request` vào cùng file đó.**

---

## 📊 FLOW HOÀN CHỈNH

```
1. Customer bấm "Gọi NV Thanh Toán"
   ↓
2. Customer Frontend emit socket: "call_waiter_payment"
   ↓
3. Customer Backend nhận socket event
   ↓
4. Customer Backend:
   - Emit socket local: "payment_request"
   - Gửi webhook POST đến Staff Backend
   ↓
5. Staff Backend nhận webhook
   ↓
6. Staff Backend emit socket: "payment_request"
   ↓
7. Staff Frontend nhận socket
   ↓
8. Staff Frontend:
   - Phát âm thanh ✅
   - Hiển thị notification ✅
   - (Optional) Highlight bàn cần thanh toán
```

---

## ✅ CHECKLIST

- [ ] Thêm route `/payment-request` vào `webhooks.routes.js`
- [ ] Tìm file socket listener trong Staff Frontend
- [ ] Thêm `socket.on("payment_request", ...)`
- [ ] Gọi `playNotificationSound()` trong listener
- [ ] Restart Staff Backend
- [ ] Test webhook bằng curl - nhận 200 OK
- [ ] Test từ Customer app - bấm "Gọi NV Thanh Toán"
- [ ] Xác nhận Staff app phát âm thanh
- [ ] Xác nhận notification hiển thị đúng

---

## 🎵 VÍ DỤ CODE ÂM THANH

### Nếu chưa có function phát âm thanh:

```javascript
// src/utils/sound.js hoặc trong component
export const playNotificationSound = () => {
  try {
    const audio = new Audio("/notification.mp3"); // Đặt file mp3 trong public/
    audio.volume = 0.5; // 50% volume
    audio.play().catch((err) => {
      console.error("Cannot play sound:", err);
    });
  } catch (error) {
    console.error("Sound error:", error);
  }
};
```

### Nếu dùng Howler.js (recommended):

```bash
npm install howler
```

```javascript
import { Howl } from "howler";

const notificationSound = new Howl({
  src: ["/notification.mp3"],
  volume: 0.5,
});

export const playNotificationSound = () => {
  notificationSound.play();
};

// Sử dụng
socket.on("order:created", (data) => {
  playNotificationSound();
  // ...
});

socket.on("payment_request", (data) => {
  playNotificationSound(); // Cùng âm thanh
  // ...
});
```

---

## 🔧 TROUBLESHOOTING

### Âm thanh không phát

**Nguyên nhân:**

- Browser block autoplay (cần user interaction trước)
- File mp3 không tồn tại
- Volume = 0

**Giải pháp:**

```javascript
// Thử phát âm thanh test khi user click vào trang
useEffect(() => {
  const handleFirstClick = () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.01; // Volume rất nhỏ
    audio.play().then(() => {
      console.log("✅ Audio unlocked");
    });
    document.removeEventListener("click", handleFirstClick);
  };

  document.addEventListener("click", handleFirstClick);
  return () => document.removeEventListener("click", handleFirstClick);
}, []);
```

### Notification hiện 2 lần

**Nguyên nhân:**

- Socket listener bị duplicate (component mount 2 lần)
- Có cả socket local và webhook cùng emit

**Giải pháp:**

```javascript
useEffect(() => {
  socket.on("payment_request", handlePaymentRequest);

  return () => {
    socket.off("payment_request", handlePaymentRequest); // Cleanup
  };
}, []);
```

---

## 🚀 DEPLOYMENT

### Sau khi test local thành công:

**Commit Staff Backend:**

```bash
cd Restaurant-staff
git add backend/routers/webhooks.routes.js
git commit -m "Add payment request webhook endpoint"
git push origin main
```

**Commit Staff Frontend:**

```bash
git add src/...  # File có thêm payment_request listener
git commit -m "Add payment request socket listener with sound notification"
git push origin main
```

Render sẽ tự động deploy cả backend và frontend.

---

## 📝 GHI CHÚ

- Payment request **KHÔNG lưu vào database** (khác với order)
- Chỉ là notification realtime → Staff xử lý ngay
- Có thể thêm badge/counter số lượng bàn đang chờ thanh toán
- Có thể thêm button "Đã xử lý" để dismiss notification

---

**Chúc bạn thành công! 🎉**
