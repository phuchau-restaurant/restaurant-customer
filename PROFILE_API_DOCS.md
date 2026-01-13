# Customer Profile Management - Backend API Documentation

## 📋 Tổng quan

Module quản lý thông tin cá nhân khách hàng với các chức năng:
- ✅ Xem thông tin profile
- ✅ Cập nhật thông tin (tên, email, số điện thoại)
- ✅ Đổi mật khẩu
- ✅ Cập nhật avatar

## 🗂️ Cấu trúc Backend

```
backend/
├── services/Customers/customersService.js     # Business logic
├── controllers/Customers/customersController.js   # HTTP handlers
├── repositories/implementation/CustomersRepository.js   # Data access
└── routers/customers.routes.js     # Route definitions
```

## 📡 API Endpoints

### 1. Get Customer Profile
```
GET /api/customers/profile/:customerId
Headers: x-tenant-id: {tenantId}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phoneNumber": "0123456789",
    "loyaltyPoints": 100,
    "isActive": true
  }
}
```

### 2. Update Customer Profile
```
PUT /api/customers/profile/:customerId
Headers: x-tenant-id: {tenantId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn B",
  "email": "nguyenvanb@example.com",
  "phoneNumber": "0987654321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated customer data */ }
}
```

**Error Cases:**
- `409 Conflict`: Email or phone already in use
- `400 Bad Request`: Invalid data format
- `404 Not Found`: Customer not found

### 3. Change Password
```
PUT /api/customers/password/:customerId
Headers: x-tenant-id: {tenantId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Cases:**
- `401 Unauthorized`: Current password incorrect
- `400 Bad Request`: New password too short (< 6 chars)

### 4. Update Avatar
```
PUT /api/customers/avatar/:customerId
Headers: x-tenant-id: {tenantId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": { /* updated customer data */ }
}
```

## 🔧 Frontend Service Usage

```javascript
import {
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  updateCustomerAvatar
} from '../services/customerProfileService';

// Get profile
const profile = await getCustomerProfile(customerId, tenantId);

// Update profile
const updated = await updateCustomerProfile(customerId, tenantId, {
  fullName: 'New Name',
  email: 'newemail@example.com',
  phoneNumber: '0123456789'
});

// Change password
await changeCustomerPassword(customerId, tenantId, 'oldPass', 'newPass');

// Update avatar
await updateCustomerAvatar(customerId, tenantId, 'https://avatar.url');
```

## ✅ Validation Rules

### Full Name
- Không được để trống
- Phải có ít nhất 2 ký tự
- Chỉ chứa chữ cái và khoảng trắng

### Email
- Định dạng email hợp lệ
- Không trùng với email khác trong cùng tenant

### Phone Number
- Bắt đầu bằng số 0
- Độ dài 10-11 số
- Không trùng với số điện thoại khác trong cùng tenant

### Password
- Mật khẩu mới phải có ít nhất 6 ký tự
- Phải nhập đúng mật khẩu hiện tại

## 🔐 Security

- Tất cả endpoints yêu cầu `x-tenant-id` header
- Password được hash bằng bcrypt
- Sensitive data (id, tenantId, password) bị loại bỏ khỏi response
- Validation đầy đủ ở cả frontend và backend

## 🎯 Next Steps

Backend đã hoàn thành. Cần tích hợp vào frontend components:

1. **ProfileInfo.jsx** - Connect API calls for:
   - Save profile → `updateCustomerProfile()`
   - Change password → `changeCustomerPassword()`
   - Upload avatar → `updateCustomerAvatar()`

2. **Error Handling** - Add error messages from API
3. **Loading States** - Show spinners during API calls
4. **Success Messages** - Show toast notifications

## 📝 Notes

- Avatar upload hiện tại chấp nhận URL. Trong tương lai có thể thêm file upload service
- Loyalty points không thể được cập nhật trực tiếp qua profile API
- Customer ID nên lấy từ CustomerContext sau khi login
