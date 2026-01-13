/**
 * Rating Service - API calls for dish ratings
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-tenant-id": localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID,
});

/**
 * Get rating for a single dish
 * GET /api/dish-ratings/:dishId
 * @param {number} dishId - Dish ID
 * @returns {Promise<Object>} Rating object
 */
export const getDishRating = async (dishId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/dish-ratings/${dishId}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error(`Fetch rating for dish ${dishId} error:`, error);
    return null;
  }
};

/**
 * Get ratings for multiple dishes (bulk)
 * POST /api/dish-ratings/bulk
 * @param {Array<number>} dishIds - Array of dish IDs
 * @returns {Promise<Object>} Map of dishId -> rating
 */
export const getBulkDishRatings = async (dishIds) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/dish-ratings/bulk`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ dishIds }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data; // Returns map: { dishId: ratingObject }
    }
    return {};
  } catch (error) {
    console.error('Fetch bulk ratings error:', error);
    return {};
  }
};

export default {
  getDishRating,
  getBulkDishRatings,
};
