// backend/controllers/AppSettings/appSettingsController.js

class AppSettingsController {
  constructor(appSettingsService) {
    this.appSettingsService = appSettingsService;
  }

  // [GET] /api/appsettings?category=avatar
  getAll = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { category } = req.query;

      const data = await this.appSettingsService.getSettingsByTenant(
        tenantId,
        category
      );

      return res.status(200).json({
        success: true,
        message: "Settings fetched successfully",
        total: data.length,
        data: data,
      });
    } catch (error) {
      next(error);
    }
  };

  // [GET] /api/appsettings/:id
  getById = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const data = await this.appSettingsService.getSettingById(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Setting fetched successfully",
        data: data,
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      else if (error.message.includes("Access denied")) error.statusCode = 403;

      next(error);
    }
  };

  // [POST] /api/appsettings
  create = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;

      const newSetting = await this.appSettingsService.createSetting({
        ...req.body,
        tenantId: tenantId,
      });

      return res.status(201).json({
        success: true,
        message: "Setting created successfully",
        data: newSetting,
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [PUT] /api/appsettings/:id
  update = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const updatedSetting = await this.appSettingsService.updateSetting(
        id,
        tenantId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Setting updated successfully",
        data: updatedSetting,
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [DELETE] /api/appsettings/:id
  delete = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      await this.appSettingsService.deleteSetting(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Setting deleted successfully",
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };
}

export default AppSettingsController;
