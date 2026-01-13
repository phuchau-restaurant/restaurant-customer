// backend/controllers/Reviews/reviewsController.js
class ReviewsController {
  constructor(reviewsService) {
    this.reviewsService = reviewsService;
  }

  /**
   * [POST] /api/reviews
   * Create a new review
   */
  create = async (req, res, next) => {
    try {
      const { customerId, dishId, orderId, rating, comment, images } = req.body;

      if (!customerId || !dishId || !rating) {
        return res.status(400).json({
          success: false,
          message: "customerId, dishId, and rating are required"
        });
      }

      const review = await this.reviewsService.createReview({
        customerId,
        dishId,
        orderId,
        rating,
        comment,
        images
      });

      return res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review.toResponse()
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  }

  /**
   * [PUT] /api/reviews/:id
   * Update an existing review
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { customerId, rating, comment, images } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required"
        });
      }

      const review = await this.reviewsService.updateReview(
        parseInt(id),
        parseInt(customerId),
        { rating, comment, images }
      );

      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review.toResponse()
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  }

  /**
   * [DELETE] /api/reviews/:id
   * Delete a review
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { customerId } = req.query;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required"
        });
      }

      const result = await this.reviewsService.deleteReview(
        parseInt(id),
        parseInt(customerId)
      );

      return res.status(200).json(result);
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  }

  /**
   * [GET] /api/reviews/dish/:dishId
   * Get all reviews for a dish
   */
  getByDish = async (req, res, next) => {
    try {
      const { dishId } = req.params;

      const reviews = await this.reviewsService.getReviewsByDish(parseInt(dishId));

      return res.status(200).json({
        success: true,
        total: reviews.length,
        data: reviews.map(r => r.toResponse())
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET] /api/reviews/customer/:customerId
   * Get all reviews by a customer
   */
  getByCustomer = async (req, res, next) => {
    try {
      const { customerId } = req.params;

      const reviews = await this.reviewsService.getReviewsByCustomer(parseInt(customerId));

      return res.status(200).json({
        success: true,
        total: reviews.length,
        data: reviews.map(r => r.toResponse())
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET] /api/reviews/:id
   * Get a single review
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;

      const review = await this.reviewsService.getReviewById(parseInt(id));

      return res.status(200).json({
        success: true,
        data: review.toResponse()
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      next(error);
    }
  }

  /**
   * [GET] /api/reviews/can-review/:dishId
   * Check if customer can review a dish
   */
  canReview = async (req, res, next) => {
    try {
      const { dishId } = req.params;
      const { customerId } = req.query;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "customerId is required"
        });
      }

      const result = await this.reviewsService.canReviewDish(
        parseInt(customerId),
        parseInt(dishId)
      );

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewsController;
