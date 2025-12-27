// backend/controllers/Modifiers/modifierGroupsController.js

/**
 * Controller xử lý HTTP requests cho Modifier Groups
 */
class ModifierGroupsController {
  constructor(modifierGroupsService) {
    this.modifierGroupsService = modifierGroupsService;
  }

  // ==================== MODIFIER GROUPS ====================

  /**
   * [GET] /api/admin/menu/modifier-groups?search=&status=&pageNumber=1&pageSize=10
   * Lấy danh sách modifier groups (có thể search và phân trang)
   */
  getAll = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;

      const { search, status, pageNumber, pageSize } = req.query;

      // Xử lý phân trang nếu có
      let pagination = null;
      if (pageNumber && pageSize) {
        pagination = {
          pageNumber: parseInt(pageNumber, 10),
          pageSize: parseInt(pageSize, 10),
        };
        if (pagination.pageNumber < 1) pagination.pageNumber = 1;
        if (pagination.pageSize < 1) pagination.pageSize = 10;
        if (pagination.pageSize > 100) pagination.pageSize = 100;
      }

      const result = await this.modifierGroupsService.getAllGroups(
        tenantId,
        search,
        status,
        pagination
      );

      // Xử lý response dựa trên có phân trang hay không
      let groupData, paginationInfo;
      if (pagination) {
        groupData = result.data;
        paginationInfo = result.pagination;
      } else {
        groupData = result;
        paginationInfo = null;
      }

      // Build response
      const response = {
        success: true,
        message: "Modifier groups fetched successfully",
        total: paginationInfo ? paginationInfo.totalItems : groupData.length,
        data: groupData,
      };

      // Thêm thông tin phân trang nếu có
      if (paginationInfo) {
        response.pagination = paginationInfo;
      }

      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * [GET] /api/admin/menu/modifier-groups/:id
   * Lấy chi tiết modifier group theo ID
   */
  getById = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const data = await this.modifierGroupsService.getGroupById(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Modifier group fetched successfully",
        data,
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      else if (error.message.includes("Access denied")) error.statusCode = 403;
      next(error);
    }
  };
}

export default ModifierGroupsController;
