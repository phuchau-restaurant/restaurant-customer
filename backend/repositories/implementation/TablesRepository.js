// backend/repositories/implementation/TablesRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";
import { Tables } from "../../models/Tables.js";

export class TablesRepository extends BaseRepository {
  constructor() {
    // tables [id, tenant_id, table_number, capacity, location, status, qr_token, ...]
    super("tables", "id");
  }

  // --- Override Create để trả về Model ---
  async create(data) {
    const entity = new Tables(data);
    const dbPayload = entity.toPersistence();
    
    // Clean payload
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([dbPayload])
      .select();

    if (error) throw new Error(`[Tables] Create failed: ${error.message}`);
    return result?.[0] ? new Tables(result[0]) : null;
  }

  // --- Override Update ---
  async update(id, updates) {
    const entity = new Tables(updates);
    const dbPayload = entity.toPersistence();

    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const { data, error } = await supabase
      .from(this.tableName)
      .update(dbPayload)
      .eq(this.primaryKey, id)
      .select();

    if (error) throw new Error(`[Tables] Update failed: ${error.message}`);
    return data?.[0] ? new Tables(data[0]) : null;
  }

  // --- Override GetAll ---
  async getAll(filters = {}) {
    const rawData = await super.getAll(filters);
    return rawData.map(item => new Tables(item));
  }

  // --- Override GetById ---
  async getById(id) {
    const rawData = await super.getById(id);
    return rawData ? new Tables(rawData) : null;
  }

  /**
   * Kiểm tra trùng Table Number trong cùng Tenant
   * @param {string} tenantId 
   * @param {string} tableNumber 
   * @param {number} excludeId - ID cần loại trừ (dùng khi Update chính bàn đó)
   */
  async findByTableNumber(tenantId, tableNumber, excludeId = null) {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("table_number", tableNumber);

    if (excludeId) {
      query = query.neq("id", excludeId); // Loại trừ ID hiện tại (cho trường hợp Update)
    }

    const { data, error } = await query;
    
    if (error) throw new Error(`FindByTableNumber failed: ${error.message}`);
    
    // Nếu có data > 0 tức là đã tồn tại
    return data && data.length > 0 ? new Tables(data[0]) : null;
  }
}