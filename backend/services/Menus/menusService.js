// backend/services/Menus/menusService.js
class MenusService {
  constructor(menusRepository, dishRatingsRepository) {
    this.menusRepo = menusRepository;
    this.dishRatingsRepo = dishRatingsRepository;
  }

  /**
   * Lấy danh sách Menu theo Tenant
   * Có thể lọc theo CategoryId nếu cần
   * @param {string} tenantId - Tenant ID
   * @param {string} categoryId - Category ID (optional)
   * @param {boolean} onlyAvailable - Filter only available items
   * @param {number} pageNumber - Page number (1-indexed)
   * @param {number} pageSize - Items per page
   * @param {string} sortBy - Sort key (price-asc, price-desc, name-asc, name-desc, popular)
   * @param {boolean} isRecommended - Filter by chef recommendation
   * @param {string} searchQuery - Search in name and description
   * @param {string} priceRange - Price range filter (under-50, 50-100, above-100)
   */
  async getMenusByTenant(tenantId, categoryId = null, onlyAvailable = false, pageNumber = null, pageSize = null, sortBy = null, isRecommended = false, searchQuery = null, priceRange = null) {
    if (!tenantId) throw new Error("Missing tenantId");

    const filters = { tenant_id: tenantId };
    
    // Nếu có lọc theo category
    if (categoryId) {
      filters.category_id = categoryId;
    }
    // Nếu chỉ lấy món đang bán
    if (onlyAvailable) {
      filters.is_available = true;
    }
    // Filter by recommendation
    if (isRecommended) {
      filters.is_recommended = true;
    }

    // Determine sort object
    let sort = null;
    if (sortBy) {
        switch (sortBy) {
            case 'price-asc': sort = { column: 'price', order: 'asc' }; break;
            case 'price-desc': sort = { column: 'price', order: 'desc' }; break;
            case 'name-asc': sort = { column: 'name', order: 'asc' }; break;
            case 'name-desc': sort = { column: 'name', order: 'desc' }; break;
            case 'popular': sort = { column: 'order_count', order: 'desc' }; break;
            default: sort = null;
        }
    }

    const result = await this.menusRepo.getAll(filters, pageNumber, pageSize, sort, searchQuery, priceRange);

    // Populate ratings
    let products = [];
    const isPaginated = result && typeof result === 'object' && 'data' in result;
    
    if (isPaginated) {
       products = result.data;
    } else if (Array.isArray(result)) {
       products = result;
    }

    if (products.length > 0 && this.dishRatingsRepo) {
        try {
            const dishIds = products.map(p => p.id);
            const ratings = await this.dishRatingsRepo.getByDishIds(dishIds);
            
            const ratingsMap = {};
            ratings.forEach(r => {
                ratingsMap[r.dishId] = r;
            });

            products.forEach(p => {
                p.rating = ratingsMap[p.id] || { totalReviews: 0, averageRating: 0 };
            });
        } catch (error) {
            console.error("Error fetching ratings:", error);
            // Non-blocking, continue without ratings
        }
    }

    return result;
  }

  async getMenuById(id, tenantId) {
    if (!id) throw new Error("Menu ID is required");
    
    const menu = await this.menusRepo.getById(id);
    if (!menu) throw new Error("Menu item not found");

    // Security Check
    if (tenantId && menu.tenantId !== tenantId) {
      throw new Error("Access denied: Menu belongs to another tenant");
    }

    if (this.dishRatingsRepo) {
        try {
            const rating = await this.dishRatingsRepo.getByDishId(id);
            menu.rating = rating || { totalReviews: 0, averageRating: 0 };
        } catch (error) {
             console.error("Error fetching rating for dish:", id, error);
            menu.rating = { totalReviews: 0, averageRating: 0 };
        }
    }

    return menu;
  }

  async createMenu(menuData) {
    const { tenantId, name, price, categoryId } = menuData;

    // 1. Validation cơ bản
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!categoryId) throw new Error("Category ID is required"); // Món ăn phải thuộc danh mục
    if (!name || name.trim() === "") throw new Error("Menu name is required");
    if (price === undefined || price < 0) throw new Error("Price must be a positive number");

    // 2. Check trùng tên (Optional - tùy logic nhà hàng có cho phép trùng tên ko)
    const existing = await this.menusRepo.findByName(tenantId, name.trim());
    if (existing && existing.length > 0) {
       const isExactMatch = existing.some(m => m.name.toLowerCase() === name.trim().toLowerCase());
       if (isExactMatch) throw new Error(`Menu '${name}' already exists`);
    }

    // 3. Gọi Repo (Data đã clean từ Controller -> CamelCase)
    return await this.menusRepo.create(menuData);
  }

  async updateMenu(id, tenantId, updates) {
    await this.getMenuById(id, tenantId); // Check quyền sở hữu

    // Validate logic giá nếu có update giá
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error("Price must be a positive number");
    }

    return await this.menusRepo.update(id, updates);
  }

  async deleteMenu(id, tenantId) {
    await this.getMenuById(id, tenantId); // Check quyền sở hữu
    return await this.menusRepo.delete(id);
  }

  /**
   * Get recommended dishes for a specific dish
   * @param {number} dishId - Dish ID
   * @param {string} tenantId - Tenant ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Recommended dishes with ratings
   */
  async getRecommendedDishes(dishId, tenantId, limit = 6) {
    try {
      // Validate dishId
      if (!dishId) {
        throw new Error("Dish ID is required");
      }

      if (!tenantId) {
        throw new Error("Tenant ID is required");
      }

      // Get recommendations from repository
      const recommendations = await this.menusRepo.getRecommendedDishes(
        dishId,
        tenantId,
        limit
      );

      // Populate ratings (same pattern as getMenusByTenant)
      if (recommendations.length > 0 && this.dishRatingsRepo) {
        try {
          const dishIds = recommendations.map(dish => dish.id);
          const ratings = await this.dishRatingsRepo.getByDishIds(dishIds);
          
          const ratingsMap = {};
          ratings.forEach(r => {
            ratingsMap[r.dishId] = r;
          });

          recommendations.forEach(dish => {
            dish.rating = ratingsMap[dish.id] || { totalReviews: 0, averageRating: 0 };
          });
        } catch (error) {
          console.error("[MenusService] Error fetching ratings for recommendations:", error);
          // Non-blocking, continue without ratings
          recommendations.forEach(dish => {
            dish.rating = { totalReviews: 0, averageRating: 0 };
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error(`[MenusService] Get recommendations for dish ${dishId} failed:`, error);
      throw error;
    }
  }
}

export default MenusService;
