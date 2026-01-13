// backend/controllers/DishRatings/dishRatingsController.js
class DishRatingsController {
  constructor(dishRatingsRepo) {
    this.dishRatingsRepo = dishRatingsRepo;
  }

  /**
   * [GET] /api/dish-ratings/:dishId
   * Get rating for a single dish
   */
  getByDish = async (req, res, next) => {
    try {
      const { dishId } = req.params;

      const rating = await this.dishRatingsRepo.getByDishId(parseInt(dishId));

      if (!rating) {
        return res.status(200).json({
          success: true,
          data: {
            dishId: parseInt(dishId),
            totalReviews: 0,
            averageRating: 0,
            rating1: 0,
            rating2: 0,
            rating3: 0,
            rating4: 0,
            rating5: 0,
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: rating.toResponse()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [POST] /api/dish-ratings/bulk
   * Get ratings for multiple dishes
   */
  getBulk = async (req, res, next) => {
    try {
      const { dishIds } = req.body;

      if (!dishIds || !Array.isArray(dishIds) || dishIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "dishIds array is required"
        });
      }

      const ratings = await this.dishRatingsRepo.getByDishIds(dishIds);

      // Create a map for quick lookup
      const ratingsMap = {};
      ratings.forEach(rating => {
        ratingsMap[rating.dishId] = rating.toResponse();
      });

      // Fill in missing dishes with zero ratings
      dishIds.forEach(dishId => {
        if (!ratingsMap[dishId]) {
          ratingsMap[dishId] = {
            dishId: dishId,
            totalReviews: 0,
            averageRating: 0,
            rating1: 0,
            rating2: 0,
            rating3: 0,
            rating4: 0,
            rating5: 0,
          };
        }
      });

      return res.status(200).json({
        success: true,
        data: ratingsMap
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DishRatingsController;
