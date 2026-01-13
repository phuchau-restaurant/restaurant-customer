/**
 * Order Service - API calls for orders
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-tenant-id": localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID,
});

/**
 * Get orders by customer ID
 * GET /api/orders/customer/:customerId
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} Array of orders
 */
export const getOrdersByCustomerId = async (customerId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/orders/customer/${customerId}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error(`Fetch orders for customer ${customerId} error:`, error);
    throw error;
  }
};

export default {
  getOrdersByCustomerId,
};
