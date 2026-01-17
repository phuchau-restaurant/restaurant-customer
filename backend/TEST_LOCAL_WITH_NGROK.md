# Test Local Backend với Staff Deployed sử dụng ngrok

## 🎯 Mục đích

Expose Customer Backend local ra public URL để Staff Backend (deployed) có thể gọi webhook.

---

## 📋 Các bước

### 1. Cài đặt ngrok

**Windows:**

```bash
# Download từ https://ngrok.com/download
# Hoặc dùng chocolatey:
choco install ngrok
```

**Mac/Linux:**

```bash
brew install ngrok
# Hoặc
npm install -g ngrok
```

### 2. Đăng ký tài khoản ngrok (Free)

1. Truy cập https://dashboard.ngrok.com/signup
2. Lấy authtoken
3. Cấu hình:

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 3. Chạy Customer Backend local

```bash
cd Restaurant-customer/backend
npm run dev
# Running on http://localhost:3000
```

### 4. Expose qua ngrok

**Terminal mới:**

```bash
ngrok http 3000
```

**Output mẫu:**

```
Session Status                online
Account                       your-email@gmail.com
Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
```

### 5. Cập nhật Staff Backend deployed

Vào Render Dashboard → Staff Backend → Environment:

```
CUSTOMER_BACKEND_WEBHOOK_URL=https://abc123.ngrok.io
```

**Lưu ý:**

- URL ngrok thay đổi mỗi lần restart (free plan)
- Paid plan có thể có fixed domain

### 6. Test

1. Customer tạo đơn (local frontend → local backend → ngrok)
2. Ngrok forward request ra internet
3. Staff Backend (deployed) nhận webhook
4. Staff Frontend (deployed) nhận socket notification

---

## ⚠️ Lưu ý

- Free ngrok có giới hạn 40 requests/minute
- URL thay đổi mỗi lần restart → Phải update env Staff Backend
- Không phù hợp cho production, chỉ dùng test

---

## 🔄 Alternative: Đảo ngược flow

Thay vì dùng webhook, cho Staff App kết nối socket đến Customer Backend:

**Staff Frontend:**

```javascript
const customerSocket = io("https://abc123.ngrok.io");
customerSocket.emit("join_waiter", waiterId);
```

Không cần webhook, Staff App trực tiếp lắng nghe events từ Customer Backend.
