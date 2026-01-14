// backend/models/DishRating.js
export class DishRating {
  constructor(data) {
    this.id = data.id;
    this.dishId = data.dish_id || data.dishId;
    this.totalReviews = data.total_reviews || data.totalReviews || 0;
    this.averageRating = data.average_rating || data.averageRating || 0;
    this.rating1 = data.rating_1 || data.rating1 || 0;
    this.rating2 = data.rating_2 || data.rating2 || 0;
    this.rating3 = data.rating_3 || data.rating3 || 0;
    this.rating4 = data.rating_4 || data.rating4 || 0;
    this.rating5 = data.rating_5 || data.rating5 || 0;
  }

  toPersistence() {
    return {
      dish_id: this.dishId,
      total_reviews: this.totalReviews,
      average_rating: this.averageRating,
      rating_1: this.rating1,
      rating_2: this.rating2,
      rating_3: this.rating3,
      rating_4: this.rating4,
      rating_5: this.rating5,
    };
  }

  toResponse() {
    return {
      dishId: this.dishId,
      totalReviews: this.totalReviews,
      averageRating: parseFloat(this.averageRating),
      rating1: this.rating1,
      rating2: this.rating2,
      rating3: this.rating3,
      rating4: this.rating4,
      rating5: this.rating5,
    };
  }
}
