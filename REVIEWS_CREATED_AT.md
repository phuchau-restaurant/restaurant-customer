# Reviews System - created_at Handling

## 📅 Trường `created_at`

### Database Schema
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  dish_id INTEGER NOT NULL,
  order_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## ✅ Xử lý trong Backend

### 1. Model (`Review.js`)
```javascript
export class Review {
  constructor(data) {
    this.createdAt = data.created_at || data.createdAt;
    // ...
  }

  toPersistence() {
    return {
      created_at: this.createdAt,
      // ...
    };
  }

  toResponse() {
    return {
      createdAt: this.createdAt,
      // ...
    };
  }
}
```

### 2. Repository (`ReviewsRepository.js`)

#### Create Method
```javascript
async create(data) {
  const entity = new Review(data);
  const dbPayload = entity.toPersistence();
  
  // Remove undefined fields
  Object.keys(dbPayload).forEach(key => 
    dbPayload[key] === undefined && delete dbPayload[key]
  );
  
  // ✅ Don't send created_at - let database set it automatically
  delete dbPayload.created_at;

  const rawData = await super.create(dbPayload);
  return rawData ? new Review(rawData) : null;
}
```

**Why delete created_at?**
- Database có `DEFAULT CURRENT_TIMESTAMP`
- Tránh conflict với timezone
- Đảm bảo thời gian chính xác theo server time

#### Get Methods (with sorting)
```javascript
async getByDishId(dishId) {
  const { data, error } = await supabase
    .from(this.tableName)
    .select("*")
    .eq("dish_id", dishId)
    .order("created_at", { ascending: false }); // ✅ Sort by created_at
  
  // ...
}

async getByCustomerId(customerId) {
  const { data, error } = await supabase
    .from(this.tableName)
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false }); // ✅ Sort by created_at
  
  // ...
}
```

---

## 🎯 API Responses

### Create Review
**Request**:
```http
POST /api/reviews
{
  "customerId": 21,
  "dishId": 1,
  "rating": 5,
  "comment": "Ngon!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "customerId": 21,
    "dishId": 1,
    "rating": 5,
    "comment": "Ngon!",
    "createdAt": "2026-01-13T16:55:00.000Z"  ← Set by database
  }
}
```

### Get Reviews
**Request**:
```http
GET /api/reviews/customer/21
```

**Response**:
```json
{
  "success": true,
  "total": 3,
  "data": [
    {
      "id": 3,
      "createdAt": "2026-01-13T16:55:00Z",  ← Newest first
      "rating": 5,
      "comment": "..."
    },
    {
      "id": 2,
      "createdAt": "2026-01-12T10:30:00Z",
      "rating": 4,
      "comment": "..."
    },
    {
      "id": 1,
      "createdAt": "2026-01-10T08:15:00Z",  ← Oldest last
      "rating": 5,
      "comment": "..."
    }
  ]
}
```

---

## 🎨 Frontend Display

### OrderReviews Component
```jsx
<div className="flex items-center gap-1 text-xs text-gray-500">
  <Calendar className="w-3 h-3" />
  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
</div>
```

**Output**: `📅 13/01/2026`

### Format Options
```javascript
// Short format
new Date(review.createdAt).toLocaleDateString('vi-VN')
// → "13/01/2026"

// Long format
new Date(review.createdAt).toLocaleString('vi-VN')
// → "13/01/2026, 23:55:00"

// Relative time (with library like date-fns)
formatDistanceToNow(new Date(review.createdAt), { 
  addSuffix: true, 
  locale: vi 
})
// → "2 ngày trước"
```

---

## ✅ Summary

**Backend**:
- ✅ Model handles `created_at` mapping (snake_case ↔ camelCase)
- ✅ Repository không gửi `created_at` khi create (để DB tự set)
- ✅ Queries sort theo `created_at DESC` (mới nhất trước)
- ✅ API response trả về `createdAt` trong format ISO 8601

**Frontend**:
- ✅ Display `createdAt` với `toLocaleDateString('vi-VN')`
- ✅ Format theo locale Việt Nam
- ✅ Icon calendar cho dễ nhìn

**Database**:
- ✅ `DEFAULT CURRENT_TIMESTAMP` tự động set time
- ✅ `TIMESTAMP WITH TIME ZONE` lưu timezone
- ✅ Không cần client gửi timestamp

---

## 🚀 Result

Mỗi review giờ có:
- ✅ Timestamp chính xác (theo server time)
- ✅ Hiển thị ngày tạo đẹp mắt
- ✅ Sort theo thứ tự mới nhất
- ✅ Timezone được handle đúng

**Ready to use!** 🎉
