// backend/repositories/implementation/CustomersRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";
import { Customers } from "../../models/Customers.js";

///<summary>
/// Repository quản lý thao tác với bảng Customers trong DB
///</summary>
export class CustomerRepository extends BaseRepository {
  constructor() {
    // Mapping: [id, tenant_id, phone_number, name, loyalty_points]
    super("customers", "id"); 
  }
  /**
   * @param {string} tenantId - ID của nhà hàng/thuê bao
   * @param {string} name - Tên cần tìm
   */

  async create(data) {
    const customerEntity = new Customers(data);
    const dbPayload = customerEntity.toPersistence();

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([dbPayload]) 
      .select();

    if (error) throw new Error(`Create failed: ${error.message}`);
    
    return result?.[0] ? new Customers(result[0]) : null;
  }

  async update(id, updates) {
    // Don't use entity for update - directly update only provided fields
    // This prevents overwriting other fields with null
    const cleanUpdates = {};
    
    // Only include fields that are actually provided
    if (updates.phoneNumber !== undefined) cleanUpdates.phone_number = updates.phoneNumber;
    if (updates.fullName !== undefined) cleanUpdates.full_name = updates.fullName;
    if (updates.email !== undefined) cleanUpdates.email = updates.email;
    if (updates.password !== undefined) cleanUpdates.password = updates.password;
    if (updates.isActive !== undefined) cleanUpdates.is_active = updates.isActive;
    if (updates.loyaltyPoints !== undefined) cleanUpdates.loyalty_points = updates.loyaltyPoints;
    if (updates.avatar !== undefined) cleanUpdates.avatar = updates.avatar;
    if (updates.googleId !== undefined) cleanUpdates.google_id = updates.googleId;
    
    const { data, error } = await supabase
      .from(this.tableName)
      .update(cleanUpdates) 
      .eq(this.primaryKey, id)
      .select();

    if (error) throw new Error(`[Customer] Update failed: ${error.message}`);
    
    return data?.[0] ? new Customers(data[0]) : null;
  }

  async findByName(tenantId, fullName) {
    if (!tenantId) throw new Error("TenantID is required for search");

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq('tenant_id', tenantId)
      .ilike('full_name', `%${fullName}%`);

    if (error) throw new Error(`FindByName failed: ${error.message}`);
    return data.map(item => new Customers(item)) || [];
  }
  
  async findByPhoneNumber(tenantId, phoneNumber) {
    if (!tenantId) throw new Error("TenantID is required for search");
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq('tenant_id', tenantId)
      .eq('phone_number', phoneNumber);

    if (error) throw new Error(`FindByPhoneNumber failed: ${error.message}`);
    return data.map(item => new Customers(item)) || [];
  }

  async findByEmail(tenantId, email) {
    if (!tenantId) throw new Error("TenantID is required for search");
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq('tenant_id', tenantId)
      .eq('email', email);

    if (error) throw new Error(`FindByEmail failed: ${error.message}`);
    return data.map(item => new Customers(item)) || [];
  }

  async findByGoogleId(tenantId, googleId) {
    if (!tenantId) throw new Error("TenantID is required for search");
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq('tenant_id', tenantId)
      .eq('google_id', googleId);

    if (error) throw new Error(`FindByGoogleId failed: ${error.message}`);
    return data.map(item => new Customers(item)) || [];
  }

  /**
   * Find by email globally (without tenantId) - for password reset
   */
  async findByEmailGlobal(email) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq('email', email)
      .limit(1); // Chỉ lấy 1 record đầu tiên

    if (error) throw new Error(`FindByEmailGlobal failed: ${error.message}`);
    return data.map(item => new Customers(item)) || [];
  }

async getById(id) {
    const rawData = await super.getById(id); 
    return rawData ? new Customers(rawData) : null; 
}

  async getAll(filters = {}) {
    const rawData = await super.getAll(filters);    
    return rawData.map(item => new Customers(item));
  }
 
}