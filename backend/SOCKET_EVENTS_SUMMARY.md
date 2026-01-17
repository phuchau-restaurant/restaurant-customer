# Socket Events - Implementation Summary

## Vấn đề ban đầu
- Customer Backend tạo đơn → Lưu vào DB
- Staff Backend (Waiter) **KHÔNG nhận thông báo realtime**
- Phải reload mới thấy đơn mới

## Nguyên nhân
2 backend deploy riêng biệt trên Render → Mỗi backend có Socket.IO server riêng → **Không chia sẻ events**

## Giải pháp: Redis Adapter

### Cách hoạt động
```
Customer Backend (Instance 1)         Staff Backend (Instance 2)
        ↓                                      ↑
   io.emit("event")                    socket.on("event")
        ↓                                      ↑
        └────→ Redis Pub/Sub ────────────────┘
```

Khi Customer Backend emit event → Redis broadcast → Tất cả backends (bao gồm Staff Backend) nhận được

## Các thay đổi đã thực hiện

### 1. Cài đặt dependencies
```bash
npm install @socket.io/redis-adapter redis
```

### 2. Cập nhật `configs/socket.js`
- Import Redis adapter
- Thiết lập Redis pub/sub clients
- Kết nối adapter với Socket.IO server
- Graceful fallback nếu không có Redis

**Code mới:**
```javascript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const setupRedisAdapter = async () => {
  const redisUrl = process.env.REDIS_URL;
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();
  
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
};
```

### 3. Thêm Socket Events trong `ordersService.js`

#### Event 1: `new_order_created`
**Khi nào**: Ngay sau khi `createOrder()` thành công  
**Payload**:
```javascript
{
  orderId: 123,
  tableId: 5,
  tableNumber: "A5",
  displayOrder: "ORD-123456",
  totalAmount: 250000,
  itemCount: 3,
  tenantId: "tenant-abc",
  status: "Unsubmit",
  timestamp: "2026-01-17T10:30:00.000Z"
}
```

**Code location**: Line ~138
```javascript
const io = getIO();
io.to("waiters").emit("new_order_created", orderPayload);
```

#### Event 2: `order_submitted`
**Khi nào**: Khi order chuyển từ "Unsubmit" → "Pending" (customer submit đơn)  
**Payload**: Tương tự `new_order_created` + status = "Pending"

**Code location**: Line ~527
```javascript
const io = getIO();
io.to("waiters").emit("order_submitted", submitPayload);
```

### 4. Tạo `.env.example`
Hướng dẫn cấu hình environment variables, bao gồm `REDIS_URL`

### 5. Tạo `REDIS_SETUP_GUIDE.md`
Hướng dẫn chi tiết:
- Cách tạo Redis instance trên Render
- Cấu hình 2 backends
- Testing & troubleshooting

## Socket Events Đã Định Nghĩa

| Event Name | Direction | Payload | Mục đích |
|------------|-----------|---------|----------|
| `join_waiter` | Client → Server | `waiterId` | Waiter join vào room "waiters" |
| `new_order_created` | Server → Client | Order info | Thông báo đơn mới được tạo |
| `order_submitted` | Server → Client | Order info | Thông báo đơn đã submit (trigger âm thanh) |
| `payment_request` | Server → Client | Payment info | Yêu cầu thanh toán |

## Cấu hình cần thiết

### Customer Backend (.env)
```env
REDIS_URL=redis://red-xxxxx:6379
FRONTEND_URL=https://customer-app.vercel.app
STAFF_URL=https://staff-app.vercel.app
```

### Staff Backend (.env)
```env
REDIS_URL=redis://red-xxxxx:6379  # PHẢI GIỐNG Customer Backend
FRONTEND_URL=https://staff-app.vercel.app
```

## Bước tiếp theo (Staff Backend)

### 1. Cài dependencies
```bash
npm install @socket.io/redis-adapter redis
```

### 2. Update `configs/socket.js`
Copy logic Redis adapter từ Customer Backend

### 3. Frontend Waiter App - Lắng nghe events
```javascript
// Join waiters room khi login
socket.emit("join_waiter", currentUser.id);

// Listen for new orders
socket.on("new_order_created", (data) => {
  console.log("📦 New order:", data.displayOrder);
  // Update UI - thêm vào danh sách đơn
});

// Listen for submitted orders (with notification)
socket.on("order_submitted", (data) => {
  console.log("🔔 Order submitted:", data.displayOrder);
  
  // Play sound
  const audio = new Audio("/notification.mp3");
  audio.play();
  
  // Show toast
  toast.success(`Đơn mới: ${data.displayOrder} - Bàn ${data.tableNumber}`);
  
  // Refresh orders list
  fetchOrders();
});
```

## Testing Checklist

- [ ] Tạo Redis instance trên Render
- [ ] Thêm `REDIS_URL` vào Customer Backend env
- [ ] Thêm `REDIS_URL` vào Staff Backend env (cùng URL)
- [ ] Deploy cả 2 backends
- [ ] Check logs: Thấy "✅ Redis Adapter connected"
- [ ] Test: Customer tạo đơn → Waiter nhận ngay (không reload)
- [ ] Test: Customer submit đơn → Waiter nghe âm thanh

## Logs mong đợi

### Customer Backend
```
✅ Redis Adapter connected - Socket events will be shared across all backend instances
✅ Socket: Emitted new_order_created to waiters room (Order: ORD-123456)
✅ Socket: Emitted order_submitted to waiters (Order: ORD-123456)
```

### Staff Backend
```
✅ Redis Adapter connected
🟢 Client connected: xyz123 (User: 5, Tenant: abc, Role: waiter)
Socket xyz123 joined waiters room (Waiter ID: 5)
```

## Files Changed

1. ✅ `backend/configs/socket.js` - Added Redis adapter
2. ✅ `backend/services/Orders/ordersService.js` - Added socket emits
3. ✅ `backend/.env.example` - Added REDIS_URL
4. ✅ `backend/package.json` - Added dependencies
5. ✅ `backend/REDIS_SETUP_GUIDE.md` - Created
6. ✅ `backend/SOCKET_EVENTS_SUMMARY.md` - Created (this file)

## Deprecations

- ❌ `STAFF_BACKEND_URL` - Không còn cần webhook
- ❌ `/api/webhooks/order-created` endpoint - Replaced by socket events

---

**Status**: ✅ Implementation Complete  
**Next**: Configure Staff Backend với cùng REDIS_URL
