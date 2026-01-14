# 🔧 Fix Log - Fix Dropdown Overlay Issue

## ❌ Vấn đề:
Khi bấm vào dropdown "Món gợi ý" trong MenuItem:
- Dropdown bị MenuItem phía dưới đè lên.
- Gây ức chế khi sử dụng.

## 🔍 Nguyên nhân:
- **Stacking Context**: Trong Grid/Flex layout, các phần tử render sau (phía dưới) mặc định có thể đè lên phần tử phía trước nếu không có z-index.
- `overflow: hidden`: Một số container cha có thể bị hidden overflow.
- `z-index` của Dropdown chưa đủ cao so với context của MenuItem kế tiếp.

## ✅ Giải pháp:
Tôi đã thực hiện cơ chế **Dynamic Z-Index**:

1. **Ở `RecommendationsDropdown.jsx`**:
   - Tăng `z-index` của dropdown panel lên `z-[100]`.
   - Thêm callback `onOpenChange` để thông báo cho parent khi trạng thái đóng/mở thay đổi.

2. **Ở `MenuItem.jsx` (Parent)**:
   - Thêm state `isRecommendationsOpen`.
   - Khi dropdown mở (`isRecommendationsOpen = true`):
     - Thêm class `z-40 relative ring-2 ring-orange-100` cho MenuItem wrapper.
     - Điều này đưa toàn bộ MenuItem đó lên một layer cao hơn các MenuItem khác.
   - Khi dropdown đóng:
     - Reset về bình thường.

## 📊 Minh họa logic:
```javascript
// MenuItem.jsx
<div className={`... ${isRecommendationsOpen ? "z-40 relative" : ""}`}>
   ...
   <RecommendationsDropdown onOpenChange={setIsRecommendationsOpen} />
   ...
</div>
```

## 🧪 Kết quả:
- Dropdown giờ sẽ luôn hiển thị **TRÊN** tất cả các content khác.
- Không bị che khuất bởi item bên dưới.
- UX mượt mà hơn với highlight effect (ring) khi mở.

---
Fix completed! 🚀
