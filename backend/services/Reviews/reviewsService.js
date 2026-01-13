// backend/services/Reviews/reviewsService.js
class ReviewsService {
  constructor(reviewsRepo, dishRatingsRepo) {
    this.reviewsRepo = reviewsRepo;
    this.dishRatingsRepo = dishRatingsRepo;
  }

  /**
   * Create a new review and update dish ratings
   */
  async createReview({ customerId, dishId, orderId, rating, comment, images }) {
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if customer has ordered this dish
    const hasOrdered = await this.reviewsRepo.hasCustomerOrderedDish(customerId, dishId);
    if (!hasOrdered) {
      throw new Error("You can only review dishes you have ordered");
    }

    // Check if customer already reviewed this dish
    const existingReview = await this.reviewsRepo.findByCustomerAndDish(customerId, dishId);
    if (existingReview) {
      throw new Error("You have already reviewed this dish");
    }

    // Create review
    const review = await this.reviewsRepo.create({
      customerId,
      dishId,
      orderId,
      rating,
      comment,
      images,
    });

    // Update dish ratings
    await this.updateDishRatings(dishId);

    return review;
  }

  /**
   * Update an existing review and recalculate dish ratings
   */
  async updateReview(id, customerId, { rating, comment, images }) {
    const review = await this.reviewsRepo.getById(id);
    if (!review) {
      throw new Error("Review not found");
    }

    // Check if this review belongs to the customer
    if (review.customerId !== customerId) {
      throw new Error("You can only update your own reviews");
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;
    if (images !== undefined) updates.images = images;

    const updatedReview = await this.reviewsRepo.update(id, updates);

    // Update dish ratings
    await this.updateDishRatings(updatedReview.dishId);

    return updatedReview;
  }

  /**
   * Delete a review and recalculate dish ratings
   */
  async deleteReview(id, customerId) {
    const review = await this.reviewsRepo.getById(id);
    if (!review) {
      throw new Error("Review not found");
    }

    // Check if this review belongs to the customer
    if (review.customerId !== customerId) {
      throw new Error("You can only delete your own reviews");
    }

    const dishId = review.dishId;
    await this.reviewsRepo.delete(id);

    // Update dish ratings
    await this.updateDishRatings(dishId);

    return { success: true, message: "Review deleted successfully" };
  }

  /**
   * Get all reviews for a dish
   */
  async getReviewsByDish(dishId) {
    return await this.reviewsRepo.getByDishId(dishId);
  }

  /**
   * Get all reviews by a customer
   */
  async getReviewsByCustomer(customerId) {
    return await this.reviewsRepo.getByCustomerId(customerId);
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(id) {
    const review = await this.reviewsRepo.getById(id);
    if (!review) {
      throw new Error("Review not found");
    }
    return review;
  }

  /**
   * Check if customer can review a dish
   */
  async canReviewDish(customerId, dishId) {
    // Check if customer has ordered this dish
    const hasOrdered = await this.reviewsRepo.hasCustomerOrderedDish(customerId, dishId);
    if (!hasOrdered) {
      return { canReview: false, reason: "You must order this dish before reviewing" };
    }

    // Check if customer already reviewed this dish
    const existingReview = await this.reviewsRepo.findByCustomerAndDish(customerId, dishId);
    if (existingReview) {
      return { canReview: false, reason: "You have already reviewed this dish" };
    }

    return { canReview: true };
  }

  /**
   * Recalculate and update dish ratings
   * Called after create/update/delete review
   */
  async updateDishRatings(dishId) {
    // Get all reviews for this dish
    const reviews = await this.reviewsRepo.getByDishId(dishId);

    if (reviews.length === 0) {
      // No reviews, set all to 0 or delete the rating record
      await this.dishRatingsRepo.upsert({
        dishId,
        totalReviews: 0,
        averageRating: 0,
        rating1: 0,
        rating2: 0,
        rating3: 0,
        rating4: 0,
        rating5: 0,
      });
      return;
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (sumRating / totalReviews).toFixed(2);

    const rating1 = reviews.filter(r => r.rating === 1).length;
    const rating2 = reviews.filter(r => r.rating === 2).length;
    const rating3 = reviews.filter(r => r.rating === 3).length;
    const rating4 = reviews.filter(r => r.rating === 4).length;
    const rating5 = reviews.filter(r => r.rating === 5).length;

    // Upsert dish ratings
    await this.dishRatingsRepo.upsert({
      dishId,
      totalReviews,
      averageRating,
      rating1,
      rating2,
      rating3,
      rating4,
      rating5,
    });
  }
}

export default ReviewsService;
