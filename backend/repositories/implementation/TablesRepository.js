// backend/repositories/implementation/TablesRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { Tables } from "../../models/Tables.js";
import { supabase } from "../../configs/database.js";

/**
 * TablesRepository
 * Kế thừa BaseRepository và thêm các phương thức đặc thù cho Tables
 */
export class TablesRepository extends BaseRepository {
  constructor() {
    super("tables", "id");
  }

  /**
   * Override để map dữ liệu vào model Tables
   */
  async getById(id) {
    const raw = await super.getById(id);
    return raw ? new Tables(raw) : null;
  }

  /**
   * Lấy table theo tenant_id và table_id
   */
  async getByIdAndTenant(id, tenantId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        `[${this.tableName}] GetByIdAndTenant failed: ${error.message}`
      );
    }
    return data ? new Tables(data) : null;
  }

  /**
   * Cập nhật thông tin QR code cho bàn
   */
  async updateQRInfo(id, tenantId, qrData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        qr_token: qrData.qrToken,
        qr_token_created_at: qrData.qrTokenCreatedAt,
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select();

    if (error) {
      throw new Error(
        `[${this.tableName}] UpdateQRInfo failed: ${error.message}`
      );
    }
    return data?.[0] ? new Tables(data[0]) : null;
  }

  /**
   * Override create để map từ model
   */
  async create(tableData) {
    const table = new Tables(tableData);
    const raw = await super.create(table.toPersistence());
    return raw ? new Tables(raw) : null;
  }

  /**
   * Lấy tất cả bàn theo tenant có qr_token
   */
  async getAllByTenantWithQR(tenantId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId)
      .not("qr_token", "is", null)
      .order("table_number", { ascending: true });

    if (error) {
      throw new Error(
        `[${this.tableName}] GetAllByTenantWithQR failed: ${error.message}`
      );
    }
    return data ? data.map((row) => new Tables(row)) : [];
  }
}
