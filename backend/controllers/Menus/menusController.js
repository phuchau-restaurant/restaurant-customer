// backend/controllers/Menus/menusController.js

class MenusController {
  constructor(menusService, categoriesService) {
    this.menusService = menusService;
    this.categoriesService = categoriesService;
  }

  // [GET] /api/menus/?categoryId=<id>&available=true&pageNumber=1&pageSize=10
  getAll = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { categoryId, available, pageNumber, pageSize, sortBy, isRecommended, searchQuery, priceRange } = req.query; // Lấy query params
      const onlyAvailable = available === "true";
      const onlyRecommended = isRecommended === "true";

      // Parse pagination params
      const page = pageNumber ? parseInt(pageNumber, 10) : null;
      const limit = pageSize ? parseInt(pageSize, 10) : null;

      // Validate pagination params
      if (page !== null && (isNaN(page) || page < 1)) {
        return res.status(400).json({
          success: false,
          message: "pageNumber must be a positive integer",
        });
      }

      if (limit !== null && (isNaN(limit) || limit < 1 || limit > 100)) {
        return res.status(400).json({
          success: false,
          message: "pageSize must be between 1 and 100",
        });
      }

      const result = await this.menusService.getMenusByTenant(
        tenantId,
        categoryId,
        onlyAvailable,
        page,
        limit,
        sortBy,
        onlyRecommended,
        searchQuery,
        priceRange
      );

      // Check if result is paginated (object with data property) or just array
      const isPaginated = result && typeof result === 'object' && 'data' in result;

      if (isPaginated) {
        // Paginated response
        const returnData = result.data.map((item) => {
          const { tenantId, ...rest } = item;
          return rest;
        });

        let categoryName = "";
        if (categoryId) {
          const category = await this.categoriesService.getCategoryById(
            categoryId,
            tenantId
          );
          categoryName = category.name + " category";
        }

        return res.status(200).json({
          success: true,
          message: `Menus fetched ${categoryName} successfully`,
          total: result.total,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          pageSize: result.pageSize,
          data: returnData,
        });
      } else {
        // Non-paginated response (backward compatibility)
        const returnData = result.map((item) => {
          const { tenantId, ...rest } = item;
          return rest;
        });

        let categoryName = "";
        if (categoryId) {
          const category = await this.categoriesService.getCategoryById(
            categoryId,
            tenantId
          );
          categoryName = category.name + " category";
        }

        return res.status(200).json({
          success: true,
          message: `Menus fetched ${categoryName} successfully`,
          total: returnData.length,
          data: returnData,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  // [GET] /api/menus/:id
  getById = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const data = await this.menusService.getMenuById(id, tenantId);

      // Lọc bỏ id và tenantId
      const { id: _id, tenantId: _tid, ...returnData } = data;

      return res.status(200).json({
        success: true,
        message: "Menu fetched successfully",
        data: returnData,
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      else if (error.message.includes("Access denied")) error.statusCode = 403;
      next(error);
    }
  };

  // [POST] /api/menus
  create = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const newMenu = await this.menusService.createMenu({
        ...req.body,
        tenantId: tenantId, // Force tenantId
      });

      // Lọc bỏ id và tenantId
      const { id: _id, tenantId: _tid, ...returnData } = newMenu;

      return res.status(201).json({
        success: true,
        message: "Menu item created successfully",
        data: returnData,
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [PUT] /api/menus/:id
  update = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const updatedMenu = await this.menusService.updateMenu(
        id,
        tenantId,
        req.body
      );

      // Lọc bỏ id và tenantId
      const { id: _id, tenantId: _tid, ...returnData } = updatedMenu;

      return res.status(200).json({
        success: true,
        message: "Menu item updated",
        data: returnData,
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [DELETE] /api/menus/:id
  delete = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      await this.menusService.deleteMenu(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Menu item deleted",
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };
}

export default MenusController;
