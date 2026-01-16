// backend/repositories/implementation/MenusRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";
import { Menus } from "../../models/Menus.js";

//Các hàm đc override cần trả về Model, không phải raw data.

export class MenusRepository extends BaseRepository {
  constructor() {
    // Mapping: [id, tenant_id, category_id, name, description, price, img_url, is_available]
    super("dishes", "id");
  }
  /**
   * Tìm category theo tên (Bắt buộc phải có tenant_id để tránh lộ data)
   * @param {string} tenantId - ID của nhà hàng/thuê bao
   * @param {string} name - Tên cần tìm
   */
  //
  async create(data) {
    const menuEntity = new Menus(data);

    const dbPayload = menuEntity.toPersistence();

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([dbPayload])
      .select();

    if (error) throw new Error(`Create failed: ${error.message}`);

    //  Map kết quả trả về ngược lại thành Model để trả lên Service
    return result?.[0] ? new Menus(result[0]) : null;
  }

  async update(id, updates) {
    //"Clean Payload"
    const menuEntity = new Menus(updates);
    const dbPayload = menuEntity.toPersistence();

    // Loại bỏ các key có giá trị undefined -> Vì default value của is_active có thể không đc truyền vào
    // lọc sạch object dbPayload.
    Object.keys(dbPayload).forEach((key) => {
      if (dbPayload[key] === undefined) {
        delete dbPayload[key];
      }
    });
    const { data, error } = await supabase
      .from(this.tableName)
      .update(dbPayload)
      .eq(this.primaryKey, id)
      .select();

    if (error) throw new Error(`[Menu] Update failed: ${error.message}`);

    //mapping return model
    return data?.[0] ? new Menus(data[0]) : null;
  }

  async findByName(tenantId, name) {
    if (!tenantId) throw new Error("TenantID is required for search");

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId) // Chỉ tìm trong tenant này
      .ilike("name", `%${name}%`);

    if (error) throw new Error(`FindByName failed: ${error.message}`);
    // return model not raw
    return data.map((item) => new Menus(item)) || [];
  }

  /**
   * Fuzzy search món ăn - cho phép tìm sai chính tả
   * Sử dụng PostgreSQL pg_trgm (trigram similarity)
   * @param {string} tenantId - ID của nhà hàng
   * @param {string} searchTerm - Từ khóa tìm kiếm (có thể sai chính tả)
   * @param {number} threshold - Ngưỡng similarity (0.0 - 1.0), mặc định 0.3
   * @returns {Promise<Array>} Danh sách món ăn với similarity score
   */
  async fuzzySearch(tenantId, searchTerm, threshold = 0.3) {
    if (!tenantId) throw new Error("TenantID is required for search");
    if (!searchTerm || searchTerm.trim() === "") return [];

    try {
      // Use PostgreSQL function with trigram similarity
      const { data, error } = await supabase.rpc("fuzzy_search_dishes", {
        p_tenant_id: tenantId,
        p_search_term: searchTerm.trim(),
        p_threshold: threshold,
      });

      if (error) {
        console.warn("Fuzzy search RPC error:", error.message);
        throw error;
      }

      // Map results to Menus model (similarity_score will be included in raw data)
      return (data || []).map((item) => new Menus(item));
    } catch (error) {
      // Fallback to simple ilike search if PostgreSQL function not available
      console.warn(
        "Fuzzy search not available, falling back to ilike:",
        error.message
      );
      return this.findByName(tenantId, searchTerm);
    }
  }

  // override thêm getById để trả về Model
  async getById(id) {
    const rawData = await super.getById(id); // Gọi cha lấy raw data
    return rawData ? new Menus(rawData) : null; // Map sang Model
  }
  /**
   * Get all menus with pagination support
   * @param {Object} filters - Filter conditions
   * @param {number} pageNumber - Page number (1-indexed)
   * @param {number} pageSize - Number of items per page
   * @param {Object} sort - Sort configuration { column, order }
   * @param {string} searchQuery - Search text for name/description (uses fuzzy search)
   * @param {string} priceRange - Price range filter (under-50, 50-100, above-100)
   * @returns {Promise<Object>} Object with data, total, totalPages, currentPage
   */
  async getAll(
    filters = {},
    pageNumber = null,
    pageSize = null,
    sort = null,
    searchQuery = null,
    priceRange = null
  ) {
    // If searchQuery is provided, use fuzzy search instead
    if (searchQuery && searchQuery.trim()) {
      return this._getAllWithFuzzySearch(
        filters,
        pageNumber,
        pageSize,
        sort,
        searchQuery,
        priceRange
      );
    }

    // Original implementation without search
    // JOIN with categories to filter only active categories
    let query = supabase
      .from(this.tableName)
      .select("*, categories!inner(is_active)", { count: "exact" })
      .eq("categories.is_active", true);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Apply price range filter
    if (priceRange) {
      switch (priceRange) {
        case "under-50":
          query = query.lt("price", 50000);
          break;
        case "50-100":
          query = query.gte("price", 50000).lte("price", 100000);
          break;
        case "above-100":
          query = query.gt("price", 100000);
          break;
      }
    }

    // Apply sorting
    if (sort) {
      // sort format: { column: 'price', order: 'asc' }
      // Ensure nulls always appear last (e.g. for popularity sort DESC)
      query = query.order(sort.column, {
        ascending: sort.order === "asc",
        nullsFirst: false,
      });
    } else {
      // Default sort (optional) - e.g. by name
      query = query.order("name", { ascending: true });
    }

    // Get total count first
    const { count: totalCount } = await query;

    // Apply pagination if provided
    if (pageNumber && pageSize) {
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data: rawData, error } = await query;

    if (error) throw new Error(`GetAll failed: ${error.message}`);

    const mappedData = rawData.map((item) => new Menus(item));

    // Return paginated response if pagination params provided
    if (pageNumber && pageSize) {
      return {
        data: mappedData,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber,
        pageSize: pageSize,
      };
    }

    // Return just data if no pagination
    return mappedData;
  }

  /**
   * Internal method: Get all with fuzzy search
   * Sử dụng fuzzy search khi có searchQuery
   */
  async _getAllWithFuzzySearch(
    filters,
    pageNumber,
    pageSize,
    sort,
    searchQuery,
    priceRange
  ) {
    try {
      // Get fuzzy search results
      const tenantId = filters.tenant_id;
      if (!tenantId) {
        throw new Error("tenant_id is required in filters for fuzzy search");
      }

      const fuzzyResults = await this.fuzzySearch(tenantId, searchQuery, 0.2);

      // Filter out items with inactive categories
      const activeMenuItems = await this._filterByActiveCategory(fuzzyResults);

      // Apply additional filters on fuzzy results
      let filteredResults = activeMenuItems;

      // Apply other filters (excluding tenant_id which is already applied)
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== "tenant_id" && value !== null && value !== undefined) {
          filteredResults = filteredResults.filter((item) => {
            // Convert to persistence format to match filter keys
            const persistedItem = item.toPersistence();
            return persistedItem[key] === value;
          });
        }
      });

      // Apply price range filter
      if (priceRange) {
        filteredResults = filteredResults.filter((item) => {
          const price = item.price;
          switch (priceRange) {
            case "under-50":
              return price < 50000;
            case "50-100":
              return price >= 50000 && price <= 100000;
            case "above-100":
              return price > 100000;
            default:
              return true;
          }
        });
      }

      // Apply sorting (fuzzy search already sorts by similarity, but we can override)
      if (sort) {
        filteredResults.sort((a, b) => {
          const aValue = a[this._toCamelCase(sort.column)];
          const bValue = b[this._toCamelCase(sort.column)];

          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;

          if (sort.order === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }
      // If no sort specified, fuzzy search results are already sorted by similarity

      const total = filteredResults.length;

      // Apply pagination
      let paginatedResults = filteredResults;
      if (pageNumber && pageSize) {
        const from = (pageNumber - 1) * pageSize;
        const to = from + pageSize;
        paginatedResults = filteredResults.slice(from, to);
      }

      // Return paginated response if pagination params provided
      if (pageNumber && pageSize) {
        return {
          data: paginatedResults,
          total: total,
          totalPages: Math.ceil(total / pageSize),
          currentPage: pageNumber,
          pageSize: pageSize,
        };
      }

      return paginatedResults;
    } catch (error) {
      console.error(
        "[MenusRepository] Fuzzy search failed, using fallback:",
        error.message
      );
      // Fallback to original ilike search
      return this._getAllWithIlikeSearch(
        filters,
        pageNumber,
        pageSize,
        sort,
        searchQuery,
        priceRange
      );
    }
  }

  /**
   * Fallback method: Get all with simple ILIKE search
   */
  async _getAllWithIlikeSearch(
    filters,
    pageNumber,
    pageSize,
    sort,
    searchQuery,
    priceRange
  ) {
    // JOIN with categories to filter only active categories
    let query = supabase
      .from(this.tableName)
      .select("*, categories!inner(is_active)", { count: "exact" })
      .eq("categories.is_active", true);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Apply search filter (search in name and description)
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      query = query.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
    }

    // Apply price range filter
    if (priceRange) {
      switch (priceRange) {
        case "under-50":
          query = query.lt("price", 50000);
          break;
        case "50-100":
          query = query.gte("price", 50000).lte("price", 100000);
          break;
        case "above-100":
          query = query.gt("price", 100000);
          break;
      }
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.column, {
        ascending: sort.order === "asc",
        nullsFirst: false,
      });
    } else {
      query = query.order("name", { ascending: true });
    }

    // Get total count first
    const { count: totalCount } = await query;

    // Apply pagination if provided
    if (pageNumber && pageSize) {
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data: rawData, error } = await query;

    if (error) throw new Error(`GetAll failed: ${error.message}`);

    const mappedData = rawData.map((item) => new Menus(item));

    // Return paginated response if pagination params provided
    if (pageNumber && pageSize) {
      return {
        data: mappedData,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: pageNumber,
        pageSize: pageSize,
      };
    }

    return mappedData;
  }

  /**
   * Helper: Convert snake_case to camelCase
   */
  _toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  ///<summary>
  /// Lấy danh sách món ăn theo danh sách ID
  ///</summary>
  async getByIds(ids) {
    if (ids.length === 0) return [];

    // Lọc trùng ID trước khi query để tối ưu
    const uniqueIds = [...new Set(ids)];

    const { data, error } = await supabase
      .from(this.tableName) // 'dishes' table
      .select("*")
      .in("id", uniqueIds);

    if (error) throw new Error(`[Menus] GetByIds failed: ${error.message}`);

    return data.map((item) => new Menus(item));
  }

  /**
   * Get recommended dishes for a specific dish
   * Logic:
   * 1. Lấy các món cùng danh mục (trừ món hiện tại)
   * 2. Ưu tiên món phổ biến (order_count cao)
   * NOTE: Ratings sẽ được populate ở Service layer
   *
   * @param {number} dishId - ID of current dish
   * @param {string} tenantId - Tenant ID
   * @param {number} limit - Number of recommendations (default: 6)
   * @returns {Promise<Array>} Array of recommended dishes (without ratings)
   */
  async getRecommendedDishes(dishId, tenantId, limit = 6) {
    try {
      // 1. Lấy thông tin món hiện tại
      const currentDish = await this.getById(dishId);
      if (!currentDish) {
        throw new Error("Dish not found");
      }

      // 2. Query gợi ý: Cùng danh mục + sắp xếp theo độ phổ biến
      // JOIN with categories to ensure category is active
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*, categories!inner(is_active)")
        .eq("categories.is_active", true) // Only active categories
        .eq("tenant_id", tenantId)
        .eq("category_id", currentDish.categoryId) // Cùng danh mục
        .eq("is_available", true) // Chỉ món đang bán
        .neq("id", dishId) // Trừ món hiện tại
        .order("order_count", { ascending: false }) // Ưu tiên món phổ biến
        .order("id", { ascending: false }) // Món mới thêm nếu order_count bằng nhau
        .limit(limit);

      if (error)
        throw new Error(
          `[Menus] GetRecommendedDishes failed: ${error.message}`
        );

      // 3. Map sang Model (ratings sẽ được thêm ở Service layer)
      return data.map((dish) => new Menus(dish));
    } catch (error) {
      console.error("[MenusRepository] Error in getRecommendedDishes:", error);
      throw error;
    }
  }

  /**
   * Helper method: Filter menu items by active category
   * @param {Array} menuItems - Array of Menus model objects
   * @returns {Promise<Array>} Filtered array with only active category items
   */
  async _filterByActiveCategory(menuItems) {
    if (!menuItems || menuItems.length === 0) {
      return [];
    }

    try {
      // Get unique category IDs from menu items
      const categoryIds = [
        ...new Set(menuItems.map((item) => item.categoryId).filter(Boolean)),
      ];

      if (categoryIds.length === 0) {
        return menuItems; // No categories to filter
      }

      // Query categories to check is_active status
      const { data: categories, error } = await supabase
        .from("categories")
        .select("id, is_active")
        .in("id", categoryIds);

      if (error) {
        console.error("[MenusRepository] Error fetching categories:", error);
        return menuItems; // Return all items if query fails
      }

      // Create a Set of active category IDs for fast lookup
      const activeCategoryIds = new Set(
        categories.filter((cat) => cat.is_active === true).map((cat) => cat.id)
      );

      // Filter menu items to only include those with active categories
      return menuItems.filter((item) => activeCategoryIds.has(item.categoryId));
    } catch (error) {
      console.error(
        "[MenusRepository] Error in _filterByActiveCategory:",
        error
      );
      return menuItems; // Return all items if filtering fails
    }
  }
}
