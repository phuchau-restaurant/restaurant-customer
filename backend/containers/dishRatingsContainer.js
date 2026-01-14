// backend/containers/dishRatingsContainer.js
import { DishRatingsRepository } from "../repositories/implementation/DishRatingsRepository.js";
import DishRatingsController from "../controllers/DishRatings/dishRatingsController.js";

// Initialize repository
const dishRatingsRepository = new DishRatingsRepository();

// Initialize controller
const dishRatingsController = new DishRatingsController(dishRatingsRepository);

export { dishRatingsController };
