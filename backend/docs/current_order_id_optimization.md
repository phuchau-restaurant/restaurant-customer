# Tối ưu hóa Logic Đặt hàng với current_order_id

## Tổng quan
Đã tối ưu hóa logic đặt hàng bằng cách sử dụng thuộc tính `current_order_id` trong bảng `tables` để theo dõi đơn hàng hiện tại của mỗi bàn, giảm thiểu số lượng truy vấn database không cần thiết.

## Các thay đổi đã thực hiện

### 1. Model Tables (✅ Đã có sẵn)
- Thuộc tính `current_order_id` đã được thêm vào model `Tables`
- File: `backend/models/Tables.js`

### 2. Tối ưu hóa `getActiveOrder()` Service
**File:** `backend/services/Orders/ordersService.js`

**Trước đây:**
```javascript
async getActiveOrder(tableId, tenantId) {
  // Query toàn bộ orders của bàn để tìm order active
  const activeOrder = await this.ordersRepo.getActiveOrderByTable(tableId, tenantId);
  if (!activeOrder) return null;
  return await this.getOrderById(activeOrder.id, tenantId);
}
```

**Sau khi tối ưu:**
```javascript
async getActiveOrder(tableId, tenantId) {
  // 1. Lấy thông tin bàn và kiểm tra current_order_id
  const table = await this.tablesRepo.getById(tableId);
  
  // 2. Nếu không có current_order_id => return null ngay (không cần query orders)
  if (!table.currentOrderId) {
    return null;
  }
  
  // 3. Lấy chi tiết order từ current_order_id
  const order = await this.getOrderById(table.currentOrderId, tenantId);
  
  // 4. Verify order còn active, nếu không thì clear current_order_id
  if (order.order.status === 'Completed' || order.order.status === 'Cancelled') {
    await this.tablesRepo.update(tableId, { currentOrderId: null });
    return null;
  }
  
  return order;
}
```

**Lợi ích:**
- ✅ Giảm 1 query database khi không có đơn hàng active
- ✅ Tự động dọn dẹp dữ liệu stale (current_order_id trỏ đến order đã hoàn thành/hủy)

### 3. Cập nhật `createOrder()` - Set current_order_id
**File:** `backend/services/Orders/ordersService.js`

**Thêm logic:**
```javascript
// Sau khi tạo order và order details thành công
await this.tablesRepo.update(tableId, { currentOrderId: newOrder.id });
```

**Mục đích:** Đánh dấu bàn đang có đơn hàng active

### 4. Cập nhật `updateOrder()` - Clear current_order_id
**File:** `backend/services/Orders/ordersService.js`

**Thêm logic khi order Completed:**
```javascript
if (updates.status === OrdersStatus.COMPLETED && 
    currentOrder.order.status !== OrdersStatus.COMPLETED) {
  // ... existing logic ...
  updates.completedAt = new Date();
  
  // Clear current_order_id
  await this.tablesRepo.update(currentOrder.order.tableId, { currentOrderId: null });
}
```

**Thêm logic khi order Cancelled:**
```javascript
if (updates.status === OrdersStatus.CANCELLED && 
    currentOrder.order.status !== OrdersStatus.CANCELLED) {
  // ... existing logic ...
  
  // Clear current_order_id
  await this.tablesRepo.update(currentOrder.order.tableId, { currentOrderId: null });
}
```

**Mục đích:** Đánh dấu bàn không còn đơn hàng active khi order hoàn thành hoặc bị hủy

### 5. Cập nhật `deleteOrder()` - Clear current_order_id
**File:** `backend/services/Orders/ordersService.js`

**Thêm logic:**
```javascript
// Trước khi xóa order, kiểm tra và clear current_order_id nếu cần
if (orderInfo.order.tableId) {
  const table = await this.tablesRepo.getById(orderInfo.order.tableId);
  if (table && table.currentOrderId === id) {
    await this.tablesRepo.update(orderInfo.order.tableId, { currentOrderId: null });
  }
}
```

**Mục đích:** Đảm bảo current_order_id được clear khi order bị xóa

## Flow hoạt động mới

### Khi khách hàng đặt món:

1. **Frontend gọi API kiểm tra active order:**
   ```
   GET /api/orders/active?tableId=123
   ```

2. **Backend xử lý (đã tối ưu):**
   ```
   ┌─────────────────────────────────────┐
   │ Lấy thông tin bàn (tables)          │
   │ SELECT * FROM tables WHERE id=123   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ Kiểm tra current_order_id           │
   └──────────────┬──────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   NULL (không có)    Có giá trị
        │                   │
        ▼                   ▼
   Return null      Lấy chi tiết order
   (Tạo order mới)  (Thêm vào order hiện tại)
   ```

3. **Khi tạo order mới:**
   - Tạo order → Set `tables.current_order_id = order.id`
   - Bàn được đánh dấu có đơn hàng active

4. **Khi order hoàn thành/hủy:**
   - Update order status → Clear `tables.current_order_id = null`
   - Bàn sẵn sàng nhận đơn hàng mới

## Lợi ích

### 1. Hiệu suất (Performance)
- ✅ **Giảm query database:** Không cần query bảng `orders` khi bàn không có đơn hàng
- ✅ **Truy vấn nhanh hơn:** Chỉ cần 1 query đến bảng `tables` thay vì query + filter orders
- ✅ **Giảm tải database:** Đặc biệt quan trọng khi có nhiều bàn và nhiều đơn hàng

### 2. Tính nhất quán (Consistency)
- ✅ **Single source of truth:** `current_order_id` là nguồn chính xác duy nhất
- ✅ **Tự động dọn dẹp:** Logic tự động clear current_order_id khi order không còn active
- ✅ **Đồng bộ dữ liệu:** Luôn đảm bảo current_order_id đúng với trạng thái thực tế

### 3. Đơn giản hóa logic (Simplicity)
- ✅ **Logic rõ ràng:** Kiểm tra null/not null thay vì filter phức tạp
- ✅ **Dễ maintain:** Tất cả logic tập trung tại một chỗ
- ✅ **Dễ debug:** Có thể kiểm tra trực tiếp current_order_id trong database

## Testing checklist

- [ ] Tạo order mới → Kiểm tra `current_order_id` được set
- [ ] Thêm món vào order hiện tại → Kiểm tra `current_order_id` không thay đổi
- [ ] Hoàn thành order → Kiểm tra `current_order_id` được clear (null)
- [ ] Hủy order → Kiểm tra `current_order_id` được clear (null)
- [ ] Xóa order → Kiểm tra `current_order_id` được clear (null)
- [ ] Kiểm tra active order khi bàn không có đơn → Trả về null nhanh
- [ ] Kiểm tra active order khi có đơn → Trả về đúng order
- [ ] Kiểm tra edge case: current_order_id trỏ đến order đã xóa → Tự động clear

## Notes

- Logic này hoàn toàn backward compatible - không ảnh hưởng đến code hiện tại
- Method `getActiveOrderByTable()` trong `OrdersRepository` vẫn được giữ lại để tương thích
- Có thể xóa method `getActiveOrderByTable()` sau khi đã test kỹ và confirm không còn sử dụng
