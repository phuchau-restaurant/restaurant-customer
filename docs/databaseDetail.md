# Physical Database Design - Multi-Tenant Architecture
**Phương pháp:** Shared Database, Shared Schema (Pooled)  
**Database Engine:** PostgreSQL
**Database Hosting:** Supabase  


##  Lưu ý quan trọng
2. **UUIDv7:** Các thuộc tính ID sử dụng `UUIDv7` để đảm bảo bảo mật (tránh đoán ID) và hiệu năng sắp xếp theo thời gian.
3. **Nguyên tắc cốt lõi:** Isolation (Cô lập dữ liệu), Data Integrity (Toàn vẹn dữ liệu), Money Safety (An toàn tiền tệ).
4. **Ngôn ngữ:** Tên thuộc tính và giá trị chuẩn hóa tiếng Anh.
5. **Mapping:** Các ghi chú "FR - Num1.Num2" tương ứng với Functional Requirements trong SRS.

---  

## PHẦN 1: GLOBAL / SYSTEM TABLES (Super Admin)
*Các bảng này dùng để quản lý hệ thống SaaS, không thuộc về riêng nhà hàng nào.*

### 1. Bảng `tenants` (Nhà hàng / Khách thuê)
Lưu trữ thông tin các nhà hàng đăng ký sử dụng hệ thống.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `UUIDv7` (PK, Default: `gen_random_uuid()`) | Định danh duy nhất của nhà hàng (TenantID). |
| **name** | `VARCHAR(100)` NOT NULL | Tên hiển thị của nhà hàng. |
| **slug** | `VARCHAR(50)` UNIQUE NOT NULL | Đường dẫn định danh (VD: `app.com/pho-thin`). |
| **owner_email** | `VARCHAR(100)` NOT NULL | Email của chủ nhà hàng (người đăng ký). |
| **status** | `VARCHAR(20)` DEFAULT `'active'` | Trạng thái: `active`, `inactive`, `suspended`. |
| **subscription_plan** | `VARCHAR(20)` DEFAULT `'basic'` | Gói dịch vụ: `basic`, `pro`, `enterprise`. |
| **created_at** | `TIMESTAMP` DEFAULT `NOW()` | Ngày đăng ký. |

### 2. Bảng `platform_users` (Super Admin)
Quản trị viên cấp cao của toàn bộ hệ thống SaaS.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID nội bộ. |
| **email** | `VARCHAR(100)` UNIQUE NOT NULL | Email đăng nhập hệ thống quản trị. |
| **password_hash** | `VARCHAR(255)` NOT NULL | Mật khẩu đã mã hóa. |
| **role** | `VARCHAR(20)` DEFAULT `'super_admin'` | Vai trò hệ thống. |

---

## PHẦN 2: TENANT RESOURCES (Tài nguyên Nhà hàng)
 **LƯU Ý:** Từ phần này, **TẤT CẢ** các bảng đều bắt buộc phải có `tenant_id`.

### 3. Bảng `users` (Nhân viên & Quản lý nhà hàng)
Tài khoản đăng nhập vào trang quản trị của từng nhà hàng.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID người dùng. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | **Quan trọng:** Thuộc nhà hàng nào. |
| **email** | `VARCHAR(100)` NOT NULL | Email đăng nhập. |
| **password_hash** | `VARCHAR(255)` NOT NULL | Mật khẩu đã mã hóa. |
| **full_name** | `VARCHAR(100)` | Tên nhân viên. |
| **role** | `VARCHAR(20)` NOT NULL (Default: `'waiter'`) | `tenant_admin`, `waiter`, `kitchen_staff` (FR-2.2). |
| **is_active** | `BOOLEAN` DEFAULT `true` | Khóa tài khoản nếu nghỉ việc. |

### 4. Bảng `tables` (Bàn ăn & QR Code)
Quản lý danh sách bàn và mã QR tương ứng.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID bàn. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | Thuộc nhà hàng nào. |
| **table_number** | `VARCHAR(20)` NOT NULL | Tên/Số bàn (VD: "Bàn 1", "VIP 2"). |
| **qr_code_url** | `TEXT` | Link hoặc chuỗi mã hóa trong QR Code (FR-4.1). |
| **status** | `VARCHAR(20)` DEFAULT `'available'` | `available` (Trống), `occupied` (Có khách), `reserved` (Đặt trước). |
| **current_order_id** | `INTEGER` (Nullable, FK -> orders.id) | ID đơn hàng đang phục vụ (nếu có). *On Delete Set Null*. |

---

## PHẦN 3: MENU MANAGEMENT (Quản lý Thực đơn)

### 5. Bảng `categories` (Danh mục món)
Ví dụ: Khai vị, Đồ uống, Món chính.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID danh mục. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | Thuộc nhà hàng nào. |
| **name** | `VARCHAR(100)` NOT NULL | Tên danh mục. |
| **display_order** | `INTEGER` DEFAULT 0 | Thứ tự hiển thị (số càng nhỏ hiển thị trước). |
| **is_active** | `BOOLEAN` DEFAULT `true` | Ẩn/Hiện danh mục. |

### 6. Bảng `menu_items` (Món ăn)

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID món ăn. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | Thuộc nhà hàng nào. |
| **category_id** | `INTEGER` (FK -> categories.id) | Thuộc danh mục nào. |
| **name** | `VARCHAR(150)` NOT NULL | Tên món ăn. |
| **description** | `TEXT` | Mô tả chi tiết món ăn. |
| **price** | `DECIMAL(12, 2)` NOT NULL | Giá bán hiện tại. |
| **image_url** | `TEXT` | Link ảnh món ăn (từ Storage). |
| **is_available** | `BOOLEAN` DEFAULT `true` | Còn hàng/Hết hàng (FR-3.2). |

---

## PHẦN 4: ORDERING & OPERATIONS (Vận hành)

### 7. Bảng `customers` (Khách hàng - Optional/Hybrid)
*Lưu ý: Trong mô hình QR Order tại bàn, khách thường là "Guest". Bảng này dùng để mở rộng tính năng Loyalty.*

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID khách hàng. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | Khách của nhà hàng nào. |
| **phone_number** | `VARCHAR(15)` | Định danh chính (nếu khách nhập). |
| **full_name** | `VARCHAR(100)` | Tên khách. |
| **loyalty_points** | `INTEGER` DEFAULT 0 | Điểm tích lũy (Future Enhancement). |

### 8. Bảng `orders` (Đơn hàng)
Bảng trung tâm của hệ thống.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `BIGSERIAL` (PK) | Dùng BIGINT vì số lượng đơn hàng sẽ rất lớn. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | Đơn của nhà hàng nào. |
| **table_id** | `INTEGER` (FK -> tables.id) | Đơn tại bàn nào. |
| **customer_id** | `INTEGER` (FK, Nullable) | Khách nào gọi (Null nếu là Guest). |
| **status** | `VARCHAR(20)` DEFAULT `'pending'` | `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`. |
| **total_amount** | `DECIMAL(12, 2)` DEFAULT 0 | Tổng tiền đơn hàng. |
| **created_at** | `TIMESTAMP` DEFAULT `NOW()` | Thời gian tạo đơn. |
| **completed_at** | `TIMESTAMP` | Thời gian hoàn thành. |

### 9. Bảng `order_items` (Chi tiết đơn hàng)
Lưu từng món trong một đơn hàng.

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `BIGSERIAL` (PK) | ID chi tiết. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | **Bắt buộc** để tối ưu truy vấn partition/sharding. |
| **order_id** | `BIGINT` (FK -> orders.id) NOT NULL | Thuộc đơn hàng nào. |
| **menu_item_id** | `INTEGER` (FK -> menu_items.id) | Món nào. |
| **quantity** | `INTEGER` NOT NULL CHECK (> 0) | Số lượng. |
| **unit_price** | `DECIMAL(12, 2)` NOT NULL | Giá tại thời điểm đặt (Snapshot giá). |
| **total_price** | `DECIMAL(12, 2)` | `quantity * unit_price` (Lưu cứng để report nhanh). |
| **note** | `VARCHAR(255)` | Ghi chú (VD: "Không hành"). |
| **status** | `VARCHAR(20)` DEFAULT `'pending'` | Trạng thái món riêng lẻ (Bar xong, Bếp chưa xong). |

### 10. Bảng `payments` (Thanh toán)

| Tên trường (snake_case) | Kiểu dữ liệu + Ràng buộc | Mô tả ngắn |
| :--- | :--- | :--- |
| **id** | `SERIAL` (PK) | ID giao dịch. |
| **tenant_id** | `UUIDv7` (FK -> tenants.id) NOT NULL | Giao dịch của nhà hàng nào. |
| **order_id** | `BIGINT` (FK -> orders.id) UNIQUE | Thanh toán cho đơn nào. |
| **amount** | `DECIMAL(12, 2)` NOT NULL | Số tiền thanh toán. |
| **payment_method** | `VARCHAR(20)` | `cash`, `momo`, `banking`, `stripe`. |
| **payment_status** | `VARCHAR(20)` DEFAULT `'pending'` | `pending`, `success`, `failed`. |
| **transaction_id** | `VARCHAR(100)` | Mã giao dịch từ cổng thanh toán. |
| **paid_at** | `TIMESTAMP` | Thời gian thanh toán thành công. |

---

##  Technical Notes & Optimization

### 1. Indexing (Chỉ mục)
* Do sử dụng kiến trúc **Pooled (Shared Database)**, việc đánh index cho cột `tenant_id` là **BẮT BUỘC** ở tất cả các bảng.
* **Mục đích:** Tránh việc quét toàn bộ bảng (Full Table Scan) khi truy vấn dữ liệu của một nhà hàng cụ thể.
* *Ví dụ SQL:* `CREATE INDEX idx_orders_tenant ON orders(tenant_id);`

### 2. Quan hệ FK tenant_id trong `order_items`
* **Vấn đề:** Mặc dù `order_items` liên kết với `orders` (đã có `tenant_id`), thiết kế này vẫn thêm `tenant_id` trực tiếp vào `order_items`.
* **Lý do (Denormalization):** Phục vụ việc **Sharding** (phân mảnh dữ liệu) trong tương lai. Khi database quá lớn cần chia nhỏ sang nhiều server vật lý khác nhau, dữ liệu sẽ được cắt theo `tenant_id`. Nếu bảng con thiếu cột này, việc di chuyển và truy vấn dữ liệu phân tán sẽ cực kỳ tốn kém tài nguyên.