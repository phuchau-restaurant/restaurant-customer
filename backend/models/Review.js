// backend/models/Review.js
export class Review {
  constructor(data) {
    this.id = data.id;
    this.customerId = data.customer_id || data.customerId;
    this.dishId = data.dish_id || data.dishId;
    this.orderId = data.order_id || data.orderId;
    this.rating = data.rating;
    this.comment = data.comment;
    this.images = data.images;
    this.createdAt = data.created_at || data.createdAt;
  }

  toPersistence() {
    return {
      customer_id: this.customerId,
      dish_id: this.dishId,
      order_id: this.orderId,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      created_at: this.createdAt,
    };
  }

  toResponse() {
    return {
      id: this.id,
      customerId: this.customerId,
      dishId: this.dishId,
      orderId: this.orderId,
      rating: this.rating,
      comment: this.comment,
      images: this.images,
      createdAt: this.createdAt,
    };
  }
}
