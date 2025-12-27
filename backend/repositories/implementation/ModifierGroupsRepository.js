// backend/repositories/implementation/ModifierGroupsRepository.js
import { BaseRepository } from "./BaseRepository.js";
import { supabase } from "../../configs/database.js";
import { ModifierGroups } from "../../models/ModifierGroups.js";
import { ModifierOptions } from "../../models/ModifierOptions.js";

/**
 * Repository cho Modifier Groups
 * Bảng: modifier_groups
 */
export class ModifierGroupsRepository extends BaseRepository {
  constructor() {
    super("modifier_groups", "id");
  }

  /**
   * Lấy tất cả modifier groups với options (modifiers) kèm theo
   * @param {string} tenantId - ID của tenant
   * @param {string} search - Từ khóa tìm kiếm (optional)
   * @param {string} status - Trạng thái (active/inactive)
   * @param {object|null} pagination - { pageNumber, pageSize } (optional)
   */
  async getAllWithOptions(tenantId, search = "", status, pagination = null) {
    let query = supabase
      .from(this.tableName)
      .select(
        `
        *,
        modifier_options (
          id,
          name,
          price_adjustment,
          is_active,
          created_at
        )
      `,
        { count: "exact" }
      )
      .eq("tenant_id", tenantId)
      .order("display_order", { ascending: true });

    // Tìm kiếm theo tên
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    // Lọc theo trạng thái
    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    // Áp dụng phân trang nếu có
    if (pagination && pagination.pageNumber && pagination.pageSize) {
      const { pageNumber, pageSize } = pagination;
      const from = (pageNumber - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`GetAllWithOptions failed: ${error.message}`);

    // Map sang model và transform modifier_options thành modifiers
    const mappedData = (data || []).map((item) => {
      const group = new ModifierGroups(item);
      group.modifiers = (item.modifier_options || []).map((opt) =>
        new ModifierOptions(opt).toResponse()
      );
      return group;
    });

    // Trả về object chứa data và thông tin phân trang nếu có
    if (pagination && pagination.pageNumber && pagination.pageSize) {
      return {
        data: mappedData,
        pagination: {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / pagination.pageSize),
        },
      };
    }

    return mappedData;
  }

  /**
   * Lấy modifier group theo ID với options kèm theo
   */
  async getByIdWithOptions(id, tenantId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(
        `
        *,
        modifier_options (
          id,
          name,
          price_adjustment,
          is_active,
          created_at
        )
      `
      )
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`GetByIdWithOptions failed: ${error.message}`);
    }

    if (!data) return null;

    const group = new ModifierGroups(data);
    group.modifiers = (data.modifier_options || []).map((opt) =>
      new ModifierOptions(opt).toResponse()
    );
    return group;
  }
}
