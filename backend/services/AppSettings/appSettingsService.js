// backend/services/AppSettings/appSettingsService.js

class AppSettingsService {
  constructor(appSettingsRepository) {
    this.appSettingsRepo = appSettingsRepository;
  }

  /**
   * Lấy danh sách settings theo tenant và category
   */
  async getSettingsByTenant(tenantId, category = null) {
    if (!tenantId) throw new Error("Missing tenantId");

    const filters = { tenant_id: tenantId };

    if (category) {
      filters.category = category;
    }

    return await this.appSettingsRepo.getAll(filters);
  }

  /**
   * Lấy setting theo ID
   */
  async getSettingById(id, tenantId) {
    if (!id) throw new Error("Setting ID is required");
    if (!tenantId) throw new Error("Tenant ID is required");

    const setting = await this.appSettingsRepo.getById(id);

    if (!setting) {
      throw new Error(`Setting with ID ${id} not found`);
    }

    if (setting.tenantId !== tenantId) {
      throw new Error("Access denied: Setting does not belong to this tenant");
    }

    return setting;
  }

  /**
   * Tạo setting mới
   */
  async createSetting({ tenantId, category, key, value }) {
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!category || category.trim() === "")
      throw new Error("Category is required");
    if (!key || key.trim() === "") throw new Error("Key is required");
    if (!value || value.trim() === "") throw new Error("Value is required");

    return await this.appSettingsRepo.create({
      tenantId,
      category: category.trim(),
      key: key.trim(),
      value: value.trim(),
    });
  }

  /**
   * Cập nhật setting
   */
  async updateSetting(id, tenantId, updateData) {
    if (!id) throw new Error("Setting ID is required");
    if (!tenantId) throw new Error("Tenant ID is required");

    // Kiểm tra setting tồn tại và thuộc tenant
    await this.getSettingById(id, tenantId);

    return await this.appSettingsRepo.update(id, updateData);
  }

  /**
   * Xóa setting
   */
  async deleteSetting(id, tenantId) {
    if (!id) throw new Error("Setting ID is required");
    if (!tenantId) throw new Error("Tenant ID is required");

    // Kiểm tra setting tồn tại và thuộc tenant
    await this.getSettingById(id, tenantId);

    return await this.appSettingsRepo.delete(id);
  }
}

export default AppSettingsService;
