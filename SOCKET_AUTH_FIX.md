# Socket Connection Fix - Staff App Not Receiving Customer Orders

## 🔍 Vấn Đề

Khi deploy lên production:
- ✅ **Admin tạo đơn** → Waiter nhận được socket notification
- ❌ **Customer tạo đơn** → Waiter KHÔNG nhận được socket notification (phải reload mới thấy)

## 🕵️ Nguyên Nhân

### Architecture Setup
- Restaurant-customer và Restaurant-staff đều kết nối đến **Restaurant-customer/backend**
- Restaurant-staff/backend KHÔNG được sử dụng trong production

### Vấn Đề Cụ Thể

**Restaurant-customer/backend/configs/socket.js** (Version cũ):
```javascript
// KHÔNG có authentication middleware
io.on("connection", (socket) => {
  // Accept all connections
});
```

**Restaurant-staff/frontend/context/SocketContext.jsx**:
```javascript
const newSocket = io(backendUrl, {
  auth: {
    token: accessToken  // ← Gửi JWT token
  }
});
```

### Điều gì xảy ra khi deploy?

1. **Local (Development)**:
   - Staff app gửi token → Customer backend IGNORE token → Connection OK ✅
   - Waiter join room "waiters" thành công
   - Nhận được events từ customer orders

2. **Production (Render/Vercel)**:
   - Staff app gửi token → Customer backend KHÔNG có JWT middleware
   - Socket.io **vẫn accept** connection nhưng...
   - Token không được verify → `socket.userId`, `socket.tenantId` = undefined
   - Có thể gây lỗi hoặc inconsistency trong các socket handlers

### Vấn Đề Phụ: CORS Configuration

Version cũ chỉ có:
```javascript
const allowedOrigins = [
  "http://localhost:5173",      // Customer dev
  process.env.FRONTEND_URL      // Customer production
];
```

Thiếu:
- `http://localhost:5174` - Staff dev
- `process.env.STAFF_URL` - Staff production

## ✅ Giải Pháp Đã Áp Dụng

### File: `Restaurant-customer/backend/configs/socket.js`

#### 1. Thêm JWT Verification (OPTIONAL)

```javascript
import jwt from "jsonwebtoken";

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
```

#### 2. Authentication Middleware (Optional)

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (token) {
    try {
      const decoded = verifyToken(token);
      console.log("✅ Socket authenticated:", {
        id: decoded.id,
        tenantId: decoded.tenantId,
        role: decoded.role
      });
      
      socket.userId = decoded.id;
      socket.tenantId = decoded.tenantId;
      socket.role = decoded.role;
    } catch (error) {
      console.warn("⚠️ Invalid token, continuing without auth:", error.message);
      // Don't reject - allow connection for customer app compatibility
    }
  } else {
    console.log("🔓 Socket connected without auth (customer app)");
  }
  
  next(); // Always allow connection
});
```

**Key Points:**
- ✅ Customer app (no token) → Connect thành công
- ✅ Staff app (with token) → Verify token và set user info
- ✅ Invalid token → Warning nhưng vẫn cho connect
- ✅ Backwards compatible với code hiện tại

#### 3. Cập Nhật CORS Origins

```javascript
const allowedOrigins = [
  "http://localhost:5173",      // Development local customer
  "http://localhost:5174",      // Development local staff
  process.env.FRONTEND_URL,     // Production customer (Vercel)
  process.env.STAFF_URL         // Production staff (Vercel)
].filter(Boolean);
```

#### 4. Thêm Transport Config cho Production

```javascript
io = new Server(httpServer, {
  cors: { ... },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});
```

## 🚀 Deployment Steps

### 1. Backend (Restaurant-customer)

```bash
cd d:/MAY/Temp/Restaurant-customer/backend
git add configs/socket.js
git commit -m "fix: add optional JWT auth for staff app socket connections"
git push origin master
```

### 2. Environment Variables (Render)

Đảm bảo các biến môi trường sau tồn tại:

```env
# Existing
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://restaurant-customer-release.vercel.app

# NEW - Add this
STAFF_URL=https://your-staff-app.vercel.app
```

### 3. Restart Services

Sau khi push code và update env vars:
1. Render sẽ tự động deploy backend
2. Kiểm tra logs để đảm bảo không có lỗi
3. Test socket connection từ staff app

## 🧪 Testing Checklist

### Local Testing

1. ✅ Customer app kết nối socket KHÔNG có token
   - Tạo đơn hàng
   - Check console: "🔓 Socket connected without auth"

2. ✅ Staff app kết nối socket CÓ token
   - Login vào staff app
   - Check console: "✅ Socket authenticated: { id: ..., tenantId: ..., role: ... }"
   - Check console: "🏠 Joined waiters room"

3. ✅ Tạo đơn từ customer → Waiter nhận notification ngay lập tức

### Production Testing

1. ✅ Deploy cả customer và staff app
2. ✅ Customer tạo đơn → Waiter màn hình phải có:
   - Toast notification
   - Âm thanh thông báo
   - Đơn mới xuất hiện trong danh sách ngay lập tức (KHÔNG cần reload)

## 📊 Socket Flow

```
Customer App                Backend                    Staff App
    │                          │                          │
    │  1. Connect (no token)   │                          │
    ├─────────────────────────►│                          │
    │                          │                          │
    │                          │   2. Connect (with token)│
    │                          │◄─────────────────────────┤
    │                          │                          │
    │                          │   3. join_waiter event   │
    │                          │◄─────────────────────────┤
    │                          │                          │
    │   4. Create order        │                          │
    ├─────────────────────────►│                          │
    │                          │                          │
    │                          │  5. emit order:created   │
    │                          │   to "waiters" room      │
    │                          ├─────────────────────────►│
    │                          │                          │
    │                          │                    6. Display
    │                          │                    notification
```

## 🔧 Troubleshooting

### Issue: Staff app không kết nối được

**Check:**
1. Browser console có lỗi CORS?
   - → Thêm STAFF_URL vào `allowedOrigins`
   
2. Render logs có "Socket authenticated"?
   - → Kiểm tra JWT_SECRET có đúng không
   
3. Token có hợp lệ?
   ```javascript
   // In browser console
   console.log("Token:", localStorage.getItem('token'));
   ```

### Issue: Vẫn không nhận được notification

**Check:**
1. Staff app có join room "waiters" không?
   ```javascript
   // Browser console should show:
   // "🏠 Joined waiters room with user ID: <id>"
   ```

2. Customer backend có emit event không?
   ```javascript
   // Render logs should show:
   // "✅ Socket: Emitted order:created event to waiters"
   ```

3. `useOrderSocket` hook có setup listener không?
   ```javascript
   // Browser console should show:
   // "👂 Setting up order socket listeners"
   ```

## 📝 Notes

- Socket.io rooms persistent qua connections
- JWT token cần fresh để kết nối thành công
- Browser có thể cache socket connections
- Production cần HTTPS cho WebSocket
- Token expiration cần được handle (refresh token)

## 🎯 Key Takeaways

1. ✅ **Optional Auth** cho phép cả customer (no auth) và staff (with auth) connect
2. ✅ **CORS config đầy đủ** cho tất cả origins (dev + production)
3. ✅ **Transport config** đảm bảo WebSocket hoạt động trên mọi platform
4. ✅ **Room "waiters"** là bridge giữa customer orders và staff notifications
5. ✅ **Backwards compatible** - không breaking changes cho code hiện tại
