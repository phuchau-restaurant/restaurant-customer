// backend/services/Modifiers/modifierGroupsService.js

/**
 * Service xử lý business logic cho Modifier Groups
 */
class ModifierGroupsService {
  constructor(modifierGroupsRepository) {
    this.groupsRepo = modifierGroupsRepository;
  }

  // ==================== MODIFIER GROUPS ====================

  /**
   * Lấy tất cả modifier groups của tenant (kèm options)
   * @param {string} tenantId - ID của tenant
   * @param {string} search - Từ khóa tìm kiếm (optional)
   * @param {string} status - Trạng thái (active/inactive)
   * @param {object|null} pagination - { pageNumber, pageSize } (optional)
   */
  async getAllGroups(tenantId, search = "", status, pagination = null) {
    if (!tenantId) throw new Error("Tenant ID is required");

    const result = await this.groupsRepo.getAllWithOptions(
      tenantId,
      search,
      status,
      pagination
    );

    // Nếu có phân trang, result là object { data, pagination }
    if (pagination && pagination.pageNumber && pagination.pageSize) {
      return {
        data: result.data.map((g) => g.toResponse()),
        pagination: result.pagination,
      };
    }

    return result.map((g) => g.toResponse());
  }

  /**
   * Lấy modifier group theo ID (kèm options)
   * @param {string} id - ID của group
   * @param {string} tenantId - ID của tenant
   */
  async getGroupById(id, tenantId) {
    if (!id) throw new Error("Group ID is required");
    if (!tenantId) throw new Error("Tenant ID is required");

    const group = await this.groupsRepo.getByIdWithOptions(id, tenantId);
    if (!group) throw new Error("Modifier group not found");

    return group.toResponse();
  }
}

export default ModifierGroupsService;
