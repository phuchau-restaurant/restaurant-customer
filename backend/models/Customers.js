// backend/models/Customers.js
export class Customers {
  constructor(data) {
    
    this.id = data.id;
    this.tenantId = data.tenant_id || data.tenantId; 
    this.phoneNumber = data.phone_number || data.phoneNumber;
    this.fullName = data.full_name || data.fullName;
    this.email = data.email ?? null;
    this.password = data.password ?? null;
    this.isActive = data.is_active ?? data.isActive ?? false;
    // Sử dụng ?? thay vì || để số 0 được chấp nhận
    // Nếu cả 2 đều null/undefined thì gán mặc định là 0
    this.loyaltyPoints = data.loyalty_points ?? data.loyaltyPoints ?? 0;
    this.avatar = data.avatar ?? null;
    this.googleId = data.google_id ?? data.googleId ?? null;
  }

  toPersistence() {
    return {
      // id thường do DB tự sinh nên có thể không cần map khi create
      tenant_id: this.tenantId,
      phone_number: this.phoneNumber,
      full_name: this.fullName,
      email: this.email,
      password: this.password,
      is_active: this.isActive,
      loyalty_points: this.loyaltyPoints,
      avatar: this.avatar,
      google_id: this.googleId,
    };
  }
}