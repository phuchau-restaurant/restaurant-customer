// backend/models/AppSettings.js

class AppSettings {
  constructor({ id, tenantId, category, key, value, createdAt, updatedAt }) {
    this.id = id;
    this.tenantId = tenantId;
    this.category = category;
    this.key = key;
    this.value = value;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default AppSettings;
