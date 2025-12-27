/**
 * Menu Service - API calls cho customer app
 * Gộp tất cả các service: Categories, App Settings, Menus, Orders
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const TENANT_ID = "019abac9-846f-75d0-8dfd-bcf9c9457866";

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ==================== CATEGORIES ====================

/**
 * Fetch all categories
 * GET /api/categories
 * @returns {Promise<Object>} Object với categories array và categoryIdMap
 */
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/categories`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const mappedCategories = [
        {
          id: "0",
          name: "All",
          iconUrl: null,
          categoryId: null,
        },
      ];

      const idMap = {};

      result.data
        .filter((cat) => cat.isActive)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .forEach((cat) => {
          const catId = cat.name.toLowerCase().replace(/\s+/g, "-");
          mappedCategories.push({
            id: catId,
            name: cat.name,
            iconUrl: cat.urlIcon,
            categoryId: cat.id,
          });
          idMap[catId] = cat.id;
        });

      return { categories: mappedCategories, categoryIdMap: idMap };
    }

    return { categories: [], categoryIdMap: {} };
  } catch (error) {
    console.error("Fetch categories error:", error);
    return {
      categories: [
        { id: "all", name: "Tất cả", iconUrl: null, categoryId: null },
      ],
      categoryIdMap: {},
    };
  }
};

// ==================== APP SETTINGS ====================

/**
 * Fetch all app settings
 * GET /api/appsettings
 * @returns {Promise<Array>} Array of settings
 */
export const fetchAppSettings = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/appsettings`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data || [];
    }
    return [];
  } catch (error) {
    console.error("Fetch app settings error:", error);
    return [];
  }
};

/**
 * Fetch avatar URLs from app settings
 * @returns {Promise<Array>} Array of avatar URLs
 */
export const fetchAvatarUrls = async () => {
  try {
    const settings = await fetchAppSettings();
    const avatarSettings = settings
      .filter((setting) => setting.category === "avatar")
      .map((setting) => setting.value);
    return avatarSettings;
  } catch (error) {
    console.error("Fetch avatar URLs error:", error);
    return [];
  }
};

/**
 * Get settings by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Array of settings in category
 */
export const fetchSettingsByCategory = async (category) => {
  try {
    const settings = await fetchAppSettings();
    return settings.filter((setting) => setting.category === category);
  } catch (error) {
    console.error(`Fetch settings for category ${category} error:`, error);
    return [];
  }
};

// ==================== DISHES & PHOTOS ====================

/**
 * Fetch dish photos by dish ID
 * GET /api/admin/menu/items/photos?dishId=...
 * @param {number} dishId - Dish ID
 * @returns {Promise<Array>} Array of photos
 */
export const fetchDishPhotos = async (dishId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/items/photos?dishId=${dishId}`,
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
    console.error(`Fetch photos for dish ${dishId} error:`, error);
    return [];
  }
};

/**
 * Fetch modifier groups by dish ID
 * GET /api/menu-item-modifier-group/full?dishId=...
 * @param {number} dishId - Dish ID
 * @returns {Promise<Array>} Array of modifier groups with options
 */
export const fetchModifierGroups = async (dishId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/menu-item-modifier-group/?dishId=${dishId}`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return Array.isArray(result.data) ? result.data : [result.data];
    }
    return [];
  } catch (error) {
    console.error(`Fetch modifier groups for dish ${dishId} error:`, error);
    return [];
  }
};

/**
 * Fetch dish details (photos and modifiers) in parallel
 * @param {Object} dish - Dish object
 * @returns {Promise<Object>} Dish with photos and modifiers
 */
export const fetchDishDetails = async (dish) => {
  try {
    const dishId = dish.id;
    
    const [photosResult, modifierGroups] = await Promise.all([
      fetchDishPhotos(dishId),
      fetchModifierGroups(dishId),
    ]);

    // API đã trả về photos theo dishId, không cần filter lại
    // Chỉ sắp xếp ảnh: isPrimary = true lên đầu
    const sortedPhotos = [...photosResult].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return 0;
    });

    return {
      ...dish,
      photos: sortedPhotos,
      modifierGroups,
    };
  } catch (error) {
    console.error(`Fetch details for dish ${dish.id} error:`, error);
    return {
      ...dish,
      photos: [],
      modifierGroups: [],
    };
  }
};

// ==================== MENUS ====================

/**
 * Map raw menu item to product format
 * @param {Object} item - Raw menu item from API
 * @param {number} index - Index for fallback ID
 * @param {Function} getCategoryName - Function to get category name
 * @returns {Object} Mapped product
 */
const mapMenuItem = (item, index, getCategoryName = () => "0") => ({
  id: item.id || index + 1,
  name: item.name,
  description: item.description || "Không có mô tả",
  price: item.price,
  category: getCategoryName(item.categoryId),
  imgUrl: item.imgUrl,
  isAvailable: item.isAvailable,
  photos: [],
  modifierGroups: [],
});

/**
 * Fetch all menus with optional category filter
 * GET /api/menus?categoryId=...
 * @param {Object} options - Options object
 * @param {number} options.categoryId - Category ID filter (optional)
 * @param {Array} options.categories - Categories array for mapping
 * @param {string} options.activeCategory - Active category ID
 * @returns {Promise<Array>} Array of products with details
 */
export const fetchMenus = async ({
  categoryId = null,
  categories = [],
  activeCategory = "0",
} = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (categoryId) {
      queryParams.append("categoryId", categoryId);
    }

    const url = `${BASE_URL}/api/menus${
      queryParams.toString() ? `?${queryParams.toString()}&available=true` : "?available=true"
    }`;

    const response = await fetch(url, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to fetch menu");
    }

    // Helper to get category name from ID
    const getCategoryNameById = (catId) => {
      const found = categories.find((c) => c.categoryId === catId);
      return found ? found.id : activeCategory;
    };

    // Map menu items
    const mapped = result.data.map((item, index) =>
      mapMenuItem(item, index, getCategoryNameById)
    );

    // Fetch details cho từng dish song song
    const dishesWithDetails = await Promise.all(
      mapped.map((dish) => fetchDishDetails(dish))
    );

    return dishesWithDetails;
  } catch (error) {
    console.error("Fetch menus error:", error);
    return [];
  }
};

// ==================== ORDERS ====================

/**
 * Submit a new order
 * POST /api/orders
 * @param {Object} orderData - Order data
 * @param {number} orderData.tableId - Table ID
 * @param {number} orderData.customerId - Customer ID
 * @param {Array} orderData.dishes - Array of dishes
 * @returns {Promise<Object>} Order response
 */
export const submitOrder = async ({ tableId, customerId, dishes }) => {
  try {
    const payload = {
      tableId,
      customerId,
      dishes: dishes.map((item) => ({
        dishId: item.id,
        quantity: item.qty,
        description: item.name,
        note: item.note?.trim() || null,
      })),
    };

    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    }
    throw new Error(result.message || "Failed to submit order");
  } catch (error) {
    console.error("Submit order error:", error);
    throw error;
  }
};

/**
 * Get orders by table ID
 * GET /api/orders?tableId=...
 * @param {number} tableId - Table ID
 * @returns {Promise<Array>} Array of orders
 */
export const fetchOrdersByTable = async (tableId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/orders?tableId=${tableId}`,
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
    console.error("Fetch orders by table error:", error);
    return [];
  }
};

// ==================== EXPORTS ====================

export default {
  // Categories
  fetchCategories,
  // App Settings
  fetchAppSettings,
  fetchAvatarUrls,
  fetchSettingsByCategory,
  // Dishes & Photos
  fetchDishPhotos,
  fetchModifierGroups,
  fetchDishDetails,
  // Menus
  fetchMenus,
  // Orders
  submitOrder,
  fetchOrdersByTable,
};
