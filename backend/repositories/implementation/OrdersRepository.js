// backend/repositories/implementation/OrdersRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { Orders } from "../../models/Orders.js";
import { supabase } from "../../configs/database.js";

export class OrdersRepository extends BaseRepository {
  constructor() { //orders: [id, tenant_id, table_id, display_order, status, total_amount, created_at, completed_at] 
    super("orders", "id");
  }

  // Hàm lấy danh sách đơn hàng có lọc status
  async getAll(filters = {}) {
    let query = supabase.from(this.tableName).select("*"); //supabase ? -> super.

    // Lọc theo status (pending, completed...)
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`[Orders] GetAll failed: ${error.message}`);
    return data.map(item => new Orders(item));
  }

  // Override create để trả về Model
  async create(data) {
    const entity = new Orders(data);
    const dbPayload = entity.toPersistence();
    
    // Clean payload
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    // Gọi cha (BaseRepository) -> Sử dụng super. thay vì await supabase
    const rawData = await super.create(dbPayload); 
    return rawData ? new Orders(rawData) : null;
  }

  async getById(id) {
    const rawData = await super.getById(id);
    return rawData ? new Orders(rawData) : null;
  }
  
  async update(id, updates) {
    // Manual mapping to avoid Model defaults overwriting existing data (e.g. total_amount -> 0)
    const dbPayload = { ...updates };

    // Map camelCase to snake_case if necessary
    if (updates.tenantId) { dbPayload.tenant_id = updates.tenantId; delete dbPayload.tenantId; }
    if (updates.tableId) { dbPayload.table_id = updates.tableId; delete dbPayload.tableId; }
    if (updates.customerId) { dbPayload.customer_id = updates.customerId; delete dbPayload.customerId; }
    if (updates.totalAmount !== undefined) { dbPayload.total_amount = updates.totalAmount; delete dbPayload.totalAmount; }
    if (updates.createdAt) { dbPayload.created_at = updates.createdAt; delete dbPayload.createdAt; }
    if (updates.completedAt) { dbPayload.completed_at = updates.completedAt; delete dbPayload.completedAt; }
    
    // Clean undefined
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const rawData = await super.update(id, dbPayload);
    return rawData ? new Orders(rawData) : null;
  }

  async delete(id) {
    const rawData = await super.delete(id);
    return rawData ? new Orders(rawData) : null;
  }

  /**
   * Get all orders by customer ID
   * @param {number} customerId - Customer ID
   * @param {string} tenantId - Tenant ID for security check
   * @returns {Promise<Array<Orders>>} Array of Orders
   */
  async getByCustomerId(customerId, tenantId) {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq('customer_id', customerId);
    
    // Add tenant filter for security
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    // Order by newest first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`[Orders] GetByCustomerId failed: ${error.message}`);
    return data.map(item => new Orders(item));
  }

  /**
   * Get active (UNSUBMIT) order for a table
   * This is used to find if there's already an open order for the table
   * @param {number} tableId - Table ID
   * @param {string} tenantId - Tenant ID for security check
   * @returns {Promise<Orders|null>} Active order or null
   */
  async getActiveOrderByTable(tableId, tenantId) {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq('table_id', tableId)
      .neq('status', 'Completed') // Not Paid/Completed
      .neq('status', 'Cancelled'); // Not Cancelled
    
    // Add tenant filter for security
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    
    // Get most recent first
    query = query.order('created_at', { ascending: false }).limit(1);

    const { data, error } = await query;
    if (error) throw new Error(`[Orders] GetActiveOrderByTable failed: ${error.message}`);
    
    // Return the first (most recent) active order or null
    return data && data.length > 0 ? new Orders(data[0]) : null;
  }
}