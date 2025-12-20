export class Tables {
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenant_id ?? data.tenantId;
    
    // Sử dụng ?? để nếu data không truyền vào thì nó là undefined
    // Repository sẽ tự động lọc bỏ undefined, giữ nguyên giá trị cũ trong DB
    this.tableNumber = data.table_number ?? data.tableNumber;
    this.capacity = data.capacity;
    
    // Lưu ý: Boolean cần dùng ?? để không bị nhận nhầm giá trị false là undefined
    this.isVip = data.is_vip ?? data.isVip ?? data.isvip; 
    
    this.location = data.location;
    
    // Bỏ default 'Active' ở đây vì Service đã xử lý lúc Create. 
    // Lúc Update nếu không truyền status thì phải là undefined.
    this.status = data.status; 

    this.createdAt = data.created_at ?? data.createdAt;
    this.updatedAt = data.updated_at ?? data.updatedAt;
    this.description = data.description; // Nếu không có sẽ là undefined

    // --- FIX QUAN TRỌNG NHẤT Ở ĐÂY ---
    // Bỏ "|| null". Nếu không có data, nó sẽ là undefined.
    this.qrToken = data.qr_token ?? data.qrToken; 
    this.qrTokenCreatedAt = data.qr_token_created_at ?? data.qrTokenCreatedAt;

    this.currentOrderId = data.current_order_id ?? data.currentOrderId;
  }

  /**
   * Mapping Service (camelCase) -> DB (snake_case)
   */
  toPersistence() {
    return {
      tenant_id: this.tenantId,
      table_number: this.tableNumber,
      capacity: this.capacity,
      location: this.location,
      is_vip: this.isVip,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      description: this.description,
      qr_token: this.qrToken,
      qr_token_created_at: this.qrTokenCreatedAt,
      current_order_id: this.currentOrderId
    };
  }
}