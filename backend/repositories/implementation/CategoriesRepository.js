// backend/repositories/implementation/CategoriesRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";

//import interface chỉ để tham chiếu (trong JS không bắt buộc implements nhưng tốt cho tư duy)
//import { ICategoriesRepository } from "../interfaces/ICategoriesRepository.js";

export class CategoryRepository extends BaseRepository {
  constructor() {
    // Mapping: [id, tenant_id, name, display_order, is_active]
    super("categories", "id"); 
  }
  /**
   * Tìm category theo tên (Bắt buộc phải có tenant_id để tránh lộ data)
   * @param {string} tenantId - ID của nhà hàng/thuê bao
   * @param {string} name - Tên cần tìm
   */
  async findByName(tenantId, name) {
    if (!tenantId) throw new Error("TenantID is required for search");

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq('tenant_id', tenantId) // Chỉ tìm trong tenant này
      .ilike('name', `%${name}%`);

    if (error) throw new Error(`FindByName failed: ${error.message}`);
    return data || [];
  }

 
}
// LƯU Ý QUAN TRỌNG:
// KHÔNG export "new SupabaseCategoryRepository()" ở đây như kiến trúc 3 lớp.
// Vì ta muốn tiêm (Inject) nó ở bên ngoài.
// -> Chỉ export class thôi.