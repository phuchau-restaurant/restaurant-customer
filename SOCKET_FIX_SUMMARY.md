# Socket Real-time Order Notification - Fix Summary

## Vấn đề
Waiter không nhận được thông báo real-time khi có đơn hàng mới từ customer app. Phải reload trang mới thấy đơn mới.

## Nguyên nhân
1. **Backend Customer** không emit socket events khi tạo/cập nhật order
2. **Backend Customer** CORS config không cho phép Vercel domain
3. **Frontend Staff** chưa join room "waiters" để nhận thông báo

## Các thay đổi đã thực hiện

### 1. Backend Customer (`Restaurant-customer/backend`)

#### a. File `services/Orders/ordersService.js`
- ✅ Import `getIO` từ `configs/socket.js`
- ✅ Thêm socket emit trong `createOrder()`:
  ```javascript
  io.to("waiters").emit("order:created", {
    orderId, tableId, tableNumber, displayOrder, 
    totalAmount, itemCount, timestamp
  });
  ```
- ✅ Thêm socket emit trong `addItemsToExistingOrder()`:
  ```javascript
  io.to("waiters").emit("order:updated", {
    orderId, tableId, tableNumber, displayOrder,
    newItemCount, newTotalAmount, timestamp
  });
  ```

#### b. File `server.js`
- ✅ Cập nhật CORS để cho phép nhiều origins:
  ```javascript
  const allowedOrigins = [
    "http://localhost:5173",  // Development
    process.env.FRONTEND_URL  // Production (Vercel)
  ];
  ```

#### c. File `configs/socket.js`
- ✅ Cập nhật Socket.IO CORS tương tự

### 2. Frontend Staff (`Restaurant-staff/frontend`)

#### File `context/SocketContext.jsx`
- ✅ Thêm logic join room "waiters" khi connect:
  ```javascript
  newSocket.on("connect", () => {
    setIsConnected(true);
    if (user?.id) {
      newSocket.emit("join_waiter", user.id);
      console.log("🏠 Joined waiters room");
    }
  });
  ```

## Flow hoạt động

1. **Customer đặt hàng** → Backend Customer tạo order
2. **Backend emit event** → `io.to("waiters").emit("order:created", data)`
3. **Staff app nhận event** → `useOrderSocket` hook lắng nghe "order:created"
4. **Callback xử lý** → `handleOrderCreated()` fetch order details và thêm vào danh sách
5. **Hiển thị thông báo** → Toast notification + âm thanh

## Cách deploy

### Backend Customer (Render)
```bash
cd d:/MAY/Temp/Restaurant-customer/backend
git add .
git commit -m "feat: add socket events for real-time order notifications"
git push origin master
```

**Quan trọng**: Đảm bảo biến môi trường trên Render:
- `FRONTEND_URL` = `https://restaurant-customer-release.vercel.app`
- `ALLOWED_ORIGINS` (nếu dùng) = cùng giá trị

### Frontend Staff (Vercel/deployed platform)
```bash
cd d:/MAY/Temp/Restaurant-staff/frontend
git add .
git commit -m "feat: auto join waiters room on socket connect"
git push origin master
```

**Quan trọng**: Đảm bảo biến môi trường:
- `VITE_BACKEND_URL` = URL backend Render của bạn (vd: `https://restaurant-customer-1.onrender.com`)

## Kiểm tra

### 1. Kiểm tra Backend logs (Render)
Sau khi customer đặt hàng, logs backend phải hiện:
```
✅ Socket: Emitted order:created event to waiters
```

### 2. Kiểm tra Frontend Staff logs (Browser Console)
Khi vào trang waiter, console phải hiện:
```
✅ Socket connected: <socket_id>
🏠 Joined waiters room with user ID: <user_id>
👂 Setting up order socket listeners
```

Khi có đơn mới:
```
🔔 New order created: { orderId: ... }
```

### 3. Test thủ công
1. Mở Staff app (Waiter screen)
2. Mở Customer app ở device/tab khác
3. Đặt hàng từ Customer app
4. **Waiter screen phải nhận thông báo ngay lập tức** (toast animation + âm thanh)

## Troubleshooting

### Vẫn không nhận được thông báo?

1. **Kiểm tra CORS**: 
   - Mở DevTools → Network tab
   - Xem có lỗi CORS không?
   
2. **Kiểm tra Socket connection**:
   ```javascript
   // Trong browser console của Staff app
   console.log("Socket connected:", socket.connected);
   ```

3. **Kiểm tra user object**:
   ```javascript
   // user?.id phải có giá trị để join room
   console.log("User:", user);
   ```

4. **Kiểm tra backend logs**: Xem backend có nhận được `join_waiter` event không

## Event Names Reference

### Backend Emits (từ Customer backend)
- `order:created` - Khi tạo đơn mới
- `order:updated` - Khi thêm món vào đơn hiện có

### Frontend Listens (Staff app)
- `order:created` - Lắng nghe đơn mới
- `order:updated` - Lắng nghe cập nhật đơn
- `order_detail:updated` - Lắng nghe cập nhật món
- `order:deleted` - Lắng nghe xóa đơn

## Notes
- Socket events sử dụng room "waiters" để broadcast
- 1 staff member có thể lắng nghe nhiều events
- Audio notification cần user interaction trước khi phát (browser policy)
