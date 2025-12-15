// backend/models/Tables.js
export class Tables {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id || data.tenantId;
    this.tableNumber = data.table_number || data.tableNumber;
    this.qrToken = data.qr_token || data.qrToken;
    this.qrTokenCreatedAt = data.qr_token_created_at || data.qrTokenCreatedAt;
    this.isActive =
      data.is_active !== undefined ? data.is_active : data.isActive;
    this.createdAt = data.created_at || data.createdAt;
  }

  /**
   * Mapping chiều vào (Service -> DB): camelCase -> snake_case
   */
  toPersistence() {
    return {
      tenant_id: this.tenantId,
      table_number: this.tableNumber,
      qr_token: this.qrToken,
      qr_token_created_at: this.qrTokenCreatedAt,
      is_active: this.isActive,
    };
  }
}
