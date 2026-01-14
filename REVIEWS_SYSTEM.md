# Reviews System - Implementation Summary

## 📋 Overview

Đã tạo hệ thống đánh giá món ăn (reviews) đầy đủ với CRUD operations và tự động cập nhật ratings.

---

## 🗃️ Database Tables

### 1. `reviews`
Lưu đánh giá của khách hàng

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| customer_id | INTEGER | FK to customers |
| dish_id | INTEGER | FK to dishes |
| order_id | INTEGER | FK to orders (optional) |
| rating | INTEGER | Rating 1-5 |
| comment | TEXT | Review comment |
| images | JSONB/TEXT | Review images (optional) |
| created_at | TIMESTAMP | Creation time |

### 2. `dish_ratings`
Cache ratings cho mỗi món ăn

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| dish_id | INTEGER | FK to dishes (UNIQUE) |
| total_reviews | INTEGER | Tổng số đánh giá |
| average_rating | DECIMAL(3,2) | Rating trung bình |
| rating_1 | INTEGER | Số lượng 1 sao |
| rating_2 | INTEGER | Số lượng 2 sao |
| rating_3 | INTEGER | Số lượng 3 sao |
| rating_4 | INTEGER | Số lượng 4 sao |
| rating_5 | INTEGER | Số lượng 5 sao |

---

## 📁 Backend Structure

### Models
✅ `backend/models/Review.js` - Review entity
✅ `backend/models/DishRating.js` - DishRating entity

### Repositories
✅ `backend/repositories/implementation/ReviewsRepository.js`
- CRUD operations
- `getByDishId()` - Get all reviews for a dish
- `getByCustomerId()` - Get all reviews by customer
- `findByCustomerAndDish()` - Check if customer reviewed dish
- `hasCustomerOrderedDish()` - Verify customer ordered the dish

✅ `backend/repositories/implementation/DishRatingsRepository.js`
- CRUD operations
- `getByDishId()` - Get rating for a dish
- `upsert()` - Insert or update rating
- `getByDishIds()` - Get ratings for multiple dishes

### Service
✅ `backend/services/Reviews/reviewsService.js`
- `createReview()` - Create review + auto update ratings
- `updateReview()` - Update review + recalculate ratings
- `deleteReview()` - Delete review + recalculate ratings
- `getReviewsByDish()` - Get all reviews for dish
- `getReviewsByCustomer()` - Get customer's reviews
- `canReviewDish()` - Check if customer can review
- `updateDishRatings()` - Private method to recalculate ratings

### Controller
✅ `backend/controllers/Reviews/reviewsController.js`
- Endpoints for all CRUD operations
- Request validation
- Error handling

### Routes
✅ `backend/routers/reviews.routes.js`
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/dish/:dishId` - Get reviews for dish
- `GET /api/reviews/customer/:customerId` - Get customer reviews
- `GET /api/reviews/:id` - Get single review
- `GET /api/reviews/can-review/:dishId` - Check if can review

### Container
✅ `backend/containers/reviewsContainer.js` - Dependency injection

### Server
✅ `backend/server.js` - Routes registered

---

## 🎯 Business Logic

### Validation Rules

1. **Can Review**:
   - ✅ Customer must have ordered the dish
   - ✅ Order must be Completed or Served
   - ✅ Customer can only review once per dish

2. **Rating**:
   - ✅ Must be between 1-5
   - ✅ Required field

3. **Comment**:
   - ✅ Optional
   - ✅ Can be empty string

### Auto-Update dish_ratings

**Triggered when**:
- Create new review
- Update existing review
- Delete review

**Calculation**:
```javascript
totalReviews = count(reviews where dish_id = X)
averageRating = avg(rating where dish_id = X)
rating_N = count(reviews where dish_id = X AND rating = N)
```

---

## 🎨 Frontend Integration

### MenuItem Component
✅ `frontend/src/components/Menu/MenuItem.jsx`

**Display**:
```jsx
{product.rating && product.rating.totalReviews > 0 && (
  <div className="flex items-center gap-2">
    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    <span>{product.rating.averageRating.toFixed(1)}</span>
    <span>({product.rating.totalReviews} đánh giá)</span>
  </div>
)}
```

**Features**:
- ⭐ Star icon (filled yellow)
- 📊 Average rating (e.g., "4.5")
- 👥 Total reviews count (e.g., "(12 đánh giá)")
- 🎨 Elegant design below dish image

---

## 📊 API Endpoints

### Create Review
```http
POST /api/reviews
Content-Type: application/json

{
  "customerId": 21,
  "dishId": 1,
  "orderId": 123,
  "rating": 5,
  "comment": "Phở rất ngon!",
  "images": null
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "customerId": 21,
    "dishId": 1,
    "orderId": 123,
    "rating": 5,
    "comment": "Phở rất ngon!",
    "images": null,
    "createdAt": "2026-01-13T..."
  }
}
```

### Update Review
```http
PUT /api/reviews/:id
Content-Type: application/json

{
  "customerId": 21,
  "rating": 4,
  "comment": "Cập nhật: Món ăn tốt"
}
```

### Delete Review
```http
DELETE /api/reviews/:id?customerId=21
```

### Get Reviews for Dish
```http
GET /api/reviews/dish/:dishId
```

### Check if Can Review
```http
GET /api/reviews/can-review/:dishId?customerId=21
```

**Response**:
```json
{
  "success": true,
  "canReview": true
}
```
OR
```json
{
  "success": true,
  "canReview": false,
  "reason": "You have already reviewed this dish"
}
```

---

## 🔒 Security

✅ **Customer Verification**: Only owners can update/delete their reviews
✅ **Order Verification**: Must have ordered dish before reviewing
✅ **Duplicate Prevention**: One review per customer per dish
✅ **Tenant Isolation**: Via tenantMiddleware

---

## ✅ Testing Checklist

### Backend
- [ ] Create review for ordered dish → Success ✅
- [ ] Create review for non-ordered dish → Error ❌
- [ ] Create duplicate review → Error ❌
- [ ] Update own review → Success ✅
- [ ] Update other's review → Error ❌
- [ ] Delete own review → Success ✅
- [ ] Verify dish_ratings updates after create/update/delete

### Frontend
- [ ] Rating displays on dishes with reviews ⭐
- [ ] No rating displays on dishes without reviews
- [ ] Rating updates after new review ✅

---

## 🚀 Next Steps

1. **Create Review UI in OrderHistory**
   - Button "Đánh giá" for completed orders
   - Rating stars selector
   - Comment textarea

2. **Display Reviews on Dish Detail**
   - List of reviews
   - Customer name + avatar
   - Rating + comment
   - Review date

3. **Image Upload for Reviews**
   - Allow customers to upload review images
   - Display images in reviews list

---

## 📝 Files Created

**Backend** (11 files):
1. models/Review.js
2. models/DishRating.js
3. repositories/implementation/ReviewsRepository.js
4. repositories/implementation/DishRatingsRepository.js
5. services/Reviews/reviewsService.js
6. controllers/Reviews/reviewsController.js
7. routers/reviews.routes.js
8. containers/reviewsContainer.js

**Backend Updated** (1 file):
9. server.js (added routes)

**Frontend Updated** (1 file):
10. components/Menu/MenuItem.jsx (added rating display)

---

## 🎉 Summary

✅ Backend CRUD complete với auto-update dish_ratings  
✅ Frontend hiển thị rating trên mỗi món ăn  
✅ Business logic: Only review dishes you've ordered  
✅ Security: Customers can only manage their own reviews  
✅ Scalable architecture following MVC pattern  

**Ready to use!** 🚀
