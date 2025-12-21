// backend/repositories/implementation/AppSettingsRepository.js

import { BaseRepository } from "./BaseRepository.js";
import AppSettings from "../../models/AppSettings.js";

class AppSettingsRepository extends BaseRepository {
  constructor() {
    super("app_settings");
  }

  /**
   * Map raw data từ DB sang AppSettings model
   */
  mapToModel(raw) {
    if (!raw) return null;
    return new AppSettings({
      id: raw.id,
      tenantId: raw.tenant_id,
      category: raw.category,
      key: raw.key,
      value: raw.value,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }

  /**
   * Lấy tất cả settings theo filters
   */
  async getAll(filters = {}) {
    const data = await super.getAll(filters);
    return data.map((item) => this.mapToModel(item));
  }

  /**
   * Lấy setting theo ID
   */
  async getById(id) {
    const data = await super.getById(id);
    return this.mapToModel(data);
  }

  /**
   * Tạo setting mới
   */
  async create(settingData) {
    const dbData = {
      tenant_id: settingData.tenantId,
      category: settingData.category,
      key: settingData.key,
      value: settingData.value,
    };

    const created = await super.create(dbData);
    return this.mapToModel(created);
  }

  /**
   * Cập nhật setting
   */
  async update(id, updateData) {
    const dbData = {};

    if (updateData.category !== undefined)
      dbData.category = updateData.category;
    if (updateData.key !== undefined) dbData.key = updateData.key;
    if (updateData.value !== undefined) dbData.value = updateData.value;

    const updated = await super.update(id, dbData);
    return this.mapToModel(updated);
  }

  /**
   * Xóa setting
   */
  async delete(id) {
    return await super.delete(id);
  }
}

export default AppSettingsRepository;
