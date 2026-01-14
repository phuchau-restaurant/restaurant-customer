# ⚡ Quick Start - Test Gợi ý Món Ăn (New UI)

## 🚀 Khởi động (2 phút)

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

## 🧪 Test nhanh Dropdown mới (5 phút)

1. Mở: `http://localhost:5173`
2. Đăng nhập → vào Menu
3. **Tìm một món ăn bất kỳ**
4. Nhìn vào phía dưới mô tả món ăn, bạn sẽ thấy nút:
   **✨ Món tương tự**
5. **Click vào nút đó**:
   - ✅ Dropdown xuất hiện
   - ✅ Nó **đè lên** các món bên dưới (không bị che)
   - ✅ MenuItem hiện tại có viền sáng cam (highlight)
6. Trong Dropdown:
   - ✅ Hiển thị 4 món tương tự
   - ✅ Click nút "+" để thêm vào giỏ

---

## ✅ Checklist UI mới

- [ ] Button "Món tương tự" hiển thị ở mỗi món
- [ ] Dropdown mở ra mượt mà
- [ ] KHÔNG bị món bên dưới che khuất (z-index fix)
- [ ] Click ra ngoài để đóng
- [ ] Thêm vào giỏ hoạt động

---

## 🐛 Troubleshooting

**Q: Dropdown vẫn bị che?**
A: Thử refresh trang. Nếu vẫn bị, kiểm tra xem browser cache có giữ file CSS cũ không.

**Q: Không thấy nút?**
A: Kiểm tra file `MenuItem.jsx` xem đã save chưa.

---

Happy Testing! 🎉
