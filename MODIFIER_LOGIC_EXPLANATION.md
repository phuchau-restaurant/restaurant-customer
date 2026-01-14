# Logic Modifier Selections - Giải thích chi tiết

## 🎯 Tổng quan

File này giải thích logic xử lý modifier selections trong `MenuItem.jsx`.

## 📊 Các thuộc tính của Modifier Group

### 1. **minSelections** (Số lượng tối thiểu)
- Số lượng options tối thiểu phải chọn
- Ví dụ: `minSelections = 1` → Phải chọn ít nhất 1 option
- **Chú ý**: `minSelections = 1` KHÔNG có nghĩa là chỉ chọn được 1, mà là phải chọn ít nhất 1

### 2. **maxSelections** (Số lượng tối đa)
- Số lượng options tối đa có thể chọn
- Ví dụ: `maxSelections = 2` → Chỉ được chọn tối đa 2 options
- Quyết định behavior (radio vs checkbox):
  - `maxSelections = 1` → **Radio behavior** (chỉ chọn 1)
  - `maxSelections > 1` → **Checkbox behavior** (chọn nhiều)

### 3. **isRequired** (Bắt buộc)
- `true`: Phải chọn ít nhất 1 option trước khi thêm vào giỏ hàng
- `false`: Có thể bỏ qua

## 🔄 Các trường hợp sử dụng

### Trường hợp 1: Radio behavior (maxSelections = 1)
```
minSelections = 0, maxSelections = 1
minSelections = 1, maxSelections = 1
```
**Behavior:**
- Chỉ chọn được 1 option
- Click vào option khác → thay thế option hiện tại
- Click vào option đã chọn → giữ nguyên (không bỏ chọn)

**Ví dụ:**
- Size: Small / Medium / Large (chọn 1)
- Độ ngọt: 30% / 50% / 70% / 100% (chọn 1)

### Trường hợp 2: Checkbox behavior (maxSelections > 1)
```
minSelections = 0, maxSelections = 3
minSelections = 1, maxSelections = 2
minSelections = 2, maxSelections = 5
```
**Behavior:**
- Có thể chọn nhiều options (tối đa theo maxSelections)
- Click vào option để toggle on/off
- Khi vượt quá maxSelections → tự động bỏ option cũ nhất (FIFO)

**Ví dụ với maxSelections = 2:**
1. Chọn Option A → `[A]`
2. Chọn Option B → `[A, B]`
3. Chọn Option C → `[B, C]` (A tự động bị bỏ - FIFO)
4. Chọn Option D → `[C, D]` (B tự động bị bỏ - FIFO)

**Ví dụ thực tế:**
- Topping (chọn tối đa 3): Trân châu, Thạch, Pudding, Kem cheese
- Extra (chọn 1-2): Đá, Đường, Sữa

### Trường hợp 3: Không giới hạn
```
minSelections = 0, maxSelections = null/undefined
```
**Behavior:**
- Chọn bao nhiêu cũng được
- Click để toggle on/off

## ⚠️ Validation khi thêm vào giỏ hàng

Hàm `validateModifiers()` kiểm tra:

### 1. isRequired
```javascript
if (group.isRequired && selectedCount === 0) {
  alert(`Vui lòng chọn ít nhất một tùy chọn cho "${group.name}"`);
  return;
}
```

### 2. minSelections
```javascript
if (group.minSelections && selectedCount < group.minSelections) {
  alert(`"${group.name}" yêu cầu chọn ít nhất ${group.minSelections} tùy chọn`);
  return;
}
```

### 3. maxSelections (double-check)
```javascript
if (group.maxSelections && selectedCount > group.maxSelections) {
  alert(`"${group.name}" chỉ cho phép chọn tối đa ${group.maxSelections} tùy chọn`);
  return;
}
```

## 🎨 Visual Feedback

### 1. Border màu đỏ
- Modifier bắt buộc chưa được chọn → border đỏ
- Code: `isRequiredNotMet ? 'border-red-300' : 'border-gray-200'`

### 2. Badge "Bắt buộc"
- Hiển thị khi `isRequired = true`
- Màu đỏ: `bg-red-100 text-red-600`

### 3. Số lượng đã chọn
- Badge hiển thị: "2 đã chọn"
- Màu cam: `bg-orange-100 text-orange-600`

### 4. Text hướng dẫn
- "Chọn 1" → maxSelections = 1
- "Chọn 2-5" → minSelections = 2, maxSelections = 5
- "Tối thiểu 2" → chỉ có minSelections
- "Tối đa 5" → chỉ có maxSelections
- "Chọn nhiều" → không giới hạn

## ❌ Lỗi thường gặp

### Lỗi: Modifier có max=2 nhưng chỉ chọn được 1
**Nguyên nhân:**
```javascript
// ❌ SAI
if (maxSelections === 1 || minSelections === 1) {
  // Radio behavior
}
```

**Giải pháp:**
```javascript
// ✅ ĐÚNG
if (maxSelections === 1) {
  // Radio behavior
}
```

**Giải thích:**
- `minSelections = 1` có nghĩa là "phải chọn ít nhất 1"
- `maxSelections = 1` có nghĩa là "chỉ được chọn tối đa 1"
- Chỉ `maxSelections = 1` mới quyết định radio behavior

## 🧪 Test Cases

### Test 1: Radio behavior
```
Input: maxSelections = 1
Actions:
  1. Click Option A → Selected: [A]
  2. Click Option B → Selected: [B] (A bị thay thế)
  3. Click Option B again → Selected: [B] (giữ nguyên)
Expected: ✅ Pass
```

### Test 2: FIFO với max = 2
```
Input: maxSelections = 2
Actions:
  1. Click A → [A]
  2. Click B → [A, B]
  3. Click C → [B, C] (A bị xóa)
  4. Click D → [C, D] (B bị xóa)
Expected: ✅ Pass
```

### Test 3: Validation - isRequired
```
Input: isRequired = true, selected = []
Action: Click "Thêm vào giỏ"
Expected: Alert hiển thị + không thêm vào giỏ ✅
```

### Test 4: Validation - minSelections
```
Input: minSelections = 2, selected = [A]
Action: Click "Thêm vào giỏ"
Expected: Alert "yêu cầu chọn ít nhất 2 tùy chọn" ✅
```
