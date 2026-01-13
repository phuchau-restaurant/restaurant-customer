// backend/containers/reviewsContainer.js
import { ReviewsRepository } from "../repositories/implementation/ReviewsRepository.js";
import { DishRatingsRepository } from "../repositories/implementation/DishRatingsRepository.js";
import ReviewsService from "../services/Reviews/reviewsService.js";
import ReviewsController from "../controllers/Reviews/reviewsController.js";

// Initialize repositories
const reviewsRepository = new ReviewsRepository();
const dishRatingsRepository = new DishRatingsRepository();

// Initialize service with dependencies
const reviewsService = new ReviewsService(
  reviewsRepository,
  dishRatingsRepository
);

// Initialize controller
const reviewsController = new ReviewsController(reviewsService);

export { reviewsController };
