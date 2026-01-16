# Cập nhật Filter Category Inactive cho API Get All Menu

## Thay đổi đã thực hiện

API `GET /api/menus` đã được cập nhật để **không lấy những món ăn có category không hoạt động** (is_active = false).

### Các file đã sửa:

1. **backend/repositories/implementation/MenusRepository.js**

   - Phương thức `getAll()`: Thêm JOIN với bảng categories và filter is_active = true
   - Phương thức `_getAllWithFuzzySearch()`: Filter menu items theo active category
   - Phương thức `_getAllWithIlikeSearch()`: Thêm JOIN với bảng categories
   - Phương thức `getRecommendedDishes()`: Thêm JOIN để đảm bảo category active
   - Thêm helper method `_filterByActiveCategory()`: Lọc menu items theo category active

2. **backend/migrations/setup_fuzzy_search.sql**
   - Cập nhật function `fuzzy_search_dishes()`: Thêm INNER JOIN với categories và filter is_active = true

## Cần thực hiện

### Bước 1: Chạy lại migration để cập nhật PostgreSQL function

Bạn cần chạy lại file migration `setup_fuzzy_search.sql` để cập nhật function `fuzzy_search_dishes()` trong database.

**Cách thực hiện:**

#### Option 1: Sử dụng Supabase SQL Editor

1. Đăng nhập vào Supabase Dashboard
2. Vào phần SQL Editor
3. Copy nội dung file `backend/migrations/setup_fuzzy_search.sql`
4. Paste và chạy script

#### Option 2: Sử dụng psql hoặc Database client

```bash
psql -h <your-host> -U <your-user> -d <your-database> -f backend/migrations/setup_fuzzy_search.sql
```

### Bước 2: Khởi động lại server (nếu cần)

```bash
cd backend
npm run dev
```

## Kiểm tra

Sau khi cập nhật, bạn có thể test bằng cách:

1. **Tạo một category và set is_active = false**
2. **Thêm một món ăn vào category đó**
3. **Gọi API GET /api/menus**
4. **Kết quả:** Món ăn đó sẽ KHÔNG xuất hiện trong danh sách

### Test API:

```bash
# Lấy tất cả menu
GET http://localhost:5000/api/menus

# Lấy menu với search
GET http://localhost:5000/api/menus?searchQuery=phở

# Lấy menu recommendations
GET http://localhost:5000/api/menus/:id/recommendations
```

## Lưu ý

- Thay đổi này ảnh hưởng đến TẤT CẢ các API get menus
- Các món có category inactive sẽ KHÔNG hiển thị cho customer
- Admin vẫn có thể quản lý các món này thông qua các API khác
- Function `fuzzy_search_dishes` cũng đã được cập nhật để đồng bộ logic
