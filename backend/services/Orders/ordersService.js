class OrdersService {
  // Inject 3 Repo: Orders, OrderDetails và Menus (để check giá món)
  constructor(ordersRepo, orderDetailsRepo, menusRepo) {
    this.ordersRepo = ordersRepo;
    this.orderDetailsRepo = orderDetailsRepo;
    this.menusRepo = menusRepo;
  }

  async createOrder({ tenantId, tableId, customerId, dishes }) {
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!tableId) throw new Error("Table ID is required");
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      throw new Error("Order must have at least one dish");
    }

    // 1. Tính toán & Chuẩn bị data chi tiết
    let calculatedTotalAmount = 0;
    const orderDetailsToCreate = [];

    for (const dish of dishes) {
      // API gửi dishId, quantity, description
      const { dishId, quantity, description } = dish;

      if (!dishId || quantity <= 0) continue;

      // Lấy thông tin món từ DB (Bảng dishes) để lấy giá chính xác
      const menuItem = await this.menusRepo.getById(dishId);
      
      if (!menuItem) {
        throw new Error(`Dish with ID ${dishId} not found`);
      }
      if (menuItem.tenantId !== tenantId) {
        throw new Error(`Dish ${dishId} does not belong to this tenant`);
      }

      const unitPrice = menuItem.price;
      const subTotal = unitPrice * quantity;
      calculatedTotalAmount += subTotal;

      orderDetailsToCreate.push({
        tenantId,
        dishId: dishId,   // Model OrderDetails dùng dishId
        quantity,
        unitPrice,
        note: description, // Map description từ API vào note
        status: 'pending'
      });
    }

    // 2. Tạo Order Header
    const newOrder = await this.ordersRepo.create({
      tenantId,
      tableId,
      customerId,
      status: 'pending',
      totalAmount: calculatedTotalAmount,
      // Tạo mã đơn hiển thị (ví dụ đơn giản)
      displayOrder: `ORD-${Date.now().toString().slice(-6)}` 
    });

    if (!newOrder) throw new Error("Failed to create order");

    // 3. Gắn OrderID vào các chi tiết và Lưu hàng loạt
    const finalDetailsPayload = orderDetailsToCreate.map(detail => ({
      ...detail,
      orderId: newOrder.id
    }));

    const createdDetails = await this.orderDetailsRepo.createMany(finalDetailsPayload);

    // 4. Trả về kết quả gộp
    return {
      order: newOrder,
      details: createdDetails
    };
  }

  async getOrderById(id, tenantId) {
      const order = await this.ordersRepo.getById(id);
      if(!order) throw new Error("Order not found");
      
      // Check Security Tenant
      if(tenantId && order.tenantId !== tenantId) throw new Error("Access denied: Order belongs to another tenant");
      
      // Lấy thêm chi tiết món
      const details = await this.orderDetailsRepo.getByOrderId(id);
      
      return { order, details };
  }
}

export default OrdersService;