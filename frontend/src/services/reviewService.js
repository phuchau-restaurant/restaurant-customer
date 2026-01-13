/**
 * Review Service - API calls for reviews
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-tenant-id": localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID,
});

/**
 * Get all reviews by customer ID
 * GET /api/reviews/customer/:customerId
 */
export const getReviewsByCustomer = async (customerId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/reviews/customer/${customerId}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Fetch customer reviews error:', error);
    return [];
  }
};

/**
 * Create a new review
 * POST /api/reviews
 */
export const createReview = async ({ customerId, dishId, orderId, rating, comment }) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/reviews`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          customerId,
          dishId,
          orderId,
          rating,
          comment,
          images: null
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create review error:', error);
    throw error;
  }
};

/**
 * Update an existing review
 * PUT /api/reviews/:id
 */
export const updateReview = async (id, customerId, { rating, comment }) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/reviews/${id}`,
      {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          customerId,
          rating,
          comment,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update review error:', error);
    throw error;
  }
};

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (id, customerId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/reviews/${id}?customerId=${customerId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete review');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Delete review error:', error);
    throw error;
  }
};

/**
 * Check if customer can review a dish
 * GET /api/reviews/can-review/:dishId
 */
export const canReviewDish = async (dishId, customerId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/reviews/can-review/${dishId}?customerId=${customerId}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result : { canReview: false };
  } catch (error) {
    console.error('Check can review error:', error);
    return { canReview: false };
  }
};

export default {
  getReviewsByCustomer,
  createReview,
  updateReview,
  deleteReview,
  canReviewDish,
};
