# Restaurant Customer App - Backend

API backend cho ứng dụng đặt món dành cho khách hàng.

## Tính năng

- 🔐 **QR Authentication**: Xác thực khách hàng qua QR code
- 👥 **Customer Management**: Quản lý thông tin khách hàng
- 📋 **Menu & Categories**: API để lấy danh sách món ăn và danh mục
- 🛒 **Orders**: Tạo và quản lý đơn hàng của khách

## API Endpoints

### Customers

- `POST /api/customers/scan-qr` - Quét QR code
- `POST /api/customers/login` - Đăng nhập khách hàng
- `GET /api/customers/profile` - Lấy thông tin khách hàng

### Menus & Categories

- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/menus` - Lấy danh sách món ăn
- `GET /api/menus/:id` - Chi tiết món ăn

### Orders

- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `GET /api/orders/customer/:customerId` - Lịch sử đơn hàng

## Tech Stack

- Node.js + Express
- Supabase (PostgreSQL)
- JWT Authentication
- Multi-tenant Architecture

## Cài đặt

```bash
npm install
npm run dev
```

## Environment Variables

```
PORT=3000
DATABASE_URL=your_supabase_url
JWT_SECRET=your_jwt_secret
```

## Documentation

- [Customer QR Flow](./CUSTOMER_QR_FLOW.md)
- [API Testing](./API_TESTING.md)
