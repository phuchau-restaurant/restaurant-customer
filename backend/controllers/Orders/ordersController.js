class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  // [POST] /api/orders
  create = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      // Body nhận: tableId, customerId, dishes: [{ dishId, quantity, description }]
      const { tableId, customerId, dishes } = req.body;

      const result = await this.ordersService.createOrder({
        tenantId,
        tableId,
        customerId,
        dishes
      });

      // --- CLEAN RESPONSE (Lọc bỏ id, tenantId) ---
      
      // 1. Clean Order Info
      const { id: _oid, tenantId: _tid, ...orderData } = result.order;
      
      // 2. Clean Details Info (Map qua từng item)
      const detailsData = result.details.map(d => {
         const { id, tenantId, orderId, ...rest } = d;
         return rest;
      });

      return res.status(201).json({
        success: true,
        message: "Create order successfully",
        total: 1,
        data: {
            ...orderData,
            items: detailsData
        }
      });
    } catch (error) {
      // Lỗi validation hoặc logic
      error.statusCode = 400;
      next(error);
    }
  }

  // [GET] /api/orders/:id
  getById = async (req, res, next) => {
      try {
          const tenantId = req.tenantId;
          const { id } = req.params;
          
          const result = await this.ordersService.getOrderById(id, tenantId);
          
          // Clean Response
          const { id: _oid, tenantId: _tid, ...orderData } = result.order;
          const detailsData = result.details.map(d => {
             const { id, tenantId, orderId, ...rest } = d;
             return rest;
          });

          return res.status(200).json({
              success: true,
              message: "Order fetched successfully",
              data: {
                ...orderData,
                items: detailsData
              }
          })
      } catch (error) {
          if (error.message.includes("not found")) error.statusCode = 404;
          else if (error.message.includes("Access denied")) error.statusCode = 403;
          next(error);
      }
  }
}

export default OrdersController;