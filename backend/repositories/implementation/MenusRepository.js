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
    Object.keys(dbPayload).forEach(key => {
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
      .eq('tenant_id', tenantId) // Chỉ tìm trong tenant này
      .ilike('name', `%${name}%`);

    if (error) throw new Error(`FindByName failed: ${error.message}`);
    // return model not raw
    return data.map(item => new Menus(item)) || [];
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
   * @param {string} searchQuery - Search text for name/description
   * @param {string} priceRange - Price range filter (under-50, 50-100, above-100)
   * @returns {Promise<Object>} Object with data, total, totalPages, currentPage
   */
  async getAll(filters = {}, pageNumber = null, pageSize = null, sort = null, searchQuery = null, priceRange = null) {
    let query = supabase.from(this.tableName).select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Apply search filter (search in name and description)
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    // Apply price range filter
    if (priceRange) {
      switch (priceRange) {
        case 'under-50':
          query = query.lt('price', 50000);
          break;
        case '50-100':
          query = query.gte('price', 50000).lte('price', 100000);
          break;
        case 'above-100':
          query = query.gt('price', 100000);
          break;
      }
    }

    // Apply sorting
    if (sort) {
       // sort format: { column: 'price', order: 'asc' }
       // Ensure nulls always appear last (e.g. for popularity sort DESC)
       query = query.order(sort.column, { ascending: sort.order === 'asc', nullsFirst: false });
    } else {
       // Default sort (optional) - e.g. by name
       query = query.order('name', { ascending: true });
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

    const mappedData = rawData.map(item => new Menus(item));

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
      .in('id', uniqueIds);

    if (error) throw new Error(`[Menus] GetByIds failed: ${error.message}`);
    
    return data.map(item => new Menus(item)); 
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
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('category_id', currentDish.categoryId)  // Cùng danh mục
        .eq('is_available', true)                    // Chỉ món đang bán
        .neq('id', dishId)                           // Trừ món hiện tại
        .order('order_count', { ascending: false })  // Ưu tiên món phổ biến
        .order('id', { ascending: false })           // Món mới thêm nếu order_count bằng nhau
        .limit(limit);

      if (error) throw new Error(`[Menus] GetRecommendedDishes failed: ${error.message}`);

      // 3. Map sang Model (ratings sẽ được thêm ở Service layer)
      return data.map(dish => new Menus(dish));
    } catch (error) {
      console.error("[MenusRepository] Error in getRecommendedDishes:", error);
      throw error;
    }
  }
}
