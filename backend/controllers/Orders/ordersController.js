// backend/controllers/Orders/ordersController.js
import OrderStatus from '../../constants/orderStatus.js';
import OrderDetailStatus from '../../constants/orderdetailStatus.js';

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
      
      // 1. Clean Order Info
      const { id: _oid, tenantId: _tid, ...orderData } = result.order;
      
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
      error.statusCode = 400;
      next(error);
    }
  }
  // [PUT] /api/orders/:id
  update = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const {status} = req.body;
      // Validate status nếu có
      if (status && !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid order status value: ${status}`
        });
      }

      // req.body chứa các trường muốn sửa: { status: 'completed', tableId: 5 ... }
      const updatedOrder = await this.ordersService.updateOrder(id, tenantId, req.body);

      // Clean Response (Destructuring)
      const { id: _oid, tenantId: _tid, ...returnData } = updatedOrder;
      const mess = status ? `Order status updated to ${status}` : `Order updated successfully`;
      return res.status(200).json({
        message: mess,
        success: true,
        data: returnData
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  }

  // [PUT] /api/kitchen/orders/:orderId/:orderDetailId
  // Cập nhật trạng thái một món ăn cụ thể
  updateOrderDetailStatus = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { orderId, orderDetailId } = req.params;
      const { status } = req.body; // Ví dụ: 'Ready', 'Served', 'Cancelled' hoặc OrderStatus.READY, .SERVED, .CANCELLED 
      console.log("Updating order detail:", { orderId, orderDetailId, status });
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required in request body"
        });
      }
      if (!Object.values(OrderDetailStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status value: ${status}`
        });
      }

      // Gọi Service (Hàm mới)
      const updatedDetail = await this.ordersService.updateDishStatus(tenantId, orderId, orderDetailId, status);
      // Clean Response
      const cleanedDetail = (({ tenantId, ...rest }) => rest)(updatedDetail);
      return res.status(200).json({
        success: true,
        message: `Order detail status ${status} updated successfully`,
        data: cleanedDetail
      });
    } catch (error) {
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
  // [DELETE] /api/orders/:id
  delete = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      await this.ordersService.deleteOrder(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Order and details deleted successfully"
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  }
  // [GET] /api/orders
  getAll = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { status } = req.query; // Lọc theo trạng thái đơn hàng nếu có
      const filters = {};
      if (status) filters.status = status;
      const orders = await this.ordersService.getAllOrders(tenantId, filters);
      //clean response 
      const responseData = orders.map(order => {
          const { /*id: _oid,*/ tenantId: _tid, ...rest } = order;
          return rest;
      });
      return res.status(200).json({
        success: true,
        message: "Get all orders successfully",
        total: orders.length,
        data: responseData //TODO: tạm thời trả về order id
      });
    } catch (error) {
      if (!error.statusCode) error.statusCode = 400;
      next(error);
    }
  }
  // [GET] /api/kitchen/orders?status= <orderStatus> & categoryId = <Id> & itemStatus = <itemStatus>
  getForKitchen = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { status, categoryId, itemStatus } = req.query; // Lấy query param

      const orderStatus = status ;//|| OrderStatus.PENDING;
      if(status && !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid order status: ${status}`
        });
      }
      
      const data = await this.ordersService.getKitchenOrders(tenantId, orderStatus, categoryId, itemStatus);
      // Clean Response
      // const cleanedData = data.map(order => {
      //     const { id: _oid, tenantId: _tid, ...orderInfo } = order;
      // });
      const isOrderStatus = orderStatus ? ` with status ${orderStatus}` : '';
      const isItemStatus = itemStatus ? ` and item status ${itemStatus}` : '';
      const categoryInfo = categoryId ? ` in category Id = ${categoryId}` : '';
      const message = `Get orders${isOrderStatus}${categoryInfo}${isItemStatus} successfully`;
      return res.status(200).json({
        success: true,
        message: message,
        total: data.length,
        data: data
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * [GET] /api/orders/customer/:customerId
   * Get all orders for a specific customer
   */
  getByCustomerId = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { customerId } = req.params;

      const orders = await this.ordersService.getOrdersByCustomerId(customerId, tenantId);

      // Clean response - remove sensitive fields
      const cleanedOrders = orders.map(order => {
        const { id: _oid, tenantId: _tid, customerId: _cid, ...orderData } = order;
        
        // Clean items
        const cleanedItems = orderData.items?.map(item => {
          const { id: _iid, tenantId: _itid, orderId: _oid, ...itemData } = item;
          return itemData;
        }) || [];

        return {
          orderId: order.id, // Keep orderId for reference
          ...orderData,
          items: cleanedItems
        };
      });

      return res.status(200).json({
        success: true,
        message: "Customer orders fetched successfully",
        total: cleanedOrders.length,
        data: cleanedOrders
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      next(error);
    }
  }

  /**
   * [GET] /api/orders/active?tableId=xxx
   * Get active (UNSUBMIT) order for a table
   */
  getActiveOrder = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { tableId } = req.query;

      if (!tableId) {
        return res.status(400).json({
          success: false,
          message: "tableId is required"
        });
      }

      const activeOrder = await this.ordersService.getActiveOrder(tableId, tenantId);

      if (!activeOrder) {
        return res.status(200).json({
          success: true,
          message: "No active order found for this table",
          data: null
        });
      }

      // Clean response
      const { id: _oid, tenantId: _tid, ...orderData } = activeOrder.order;
      const detailsData = activeOrder.details.map(d => {
        const { id, tenantId, orderId, ...rest } = d;
        return rest;
      });

      return res.status(200).json({
        success: true,
        message: "Active order found",
        data: {
          orderId: activeOrder.order.id, // Include ID for subsequent operations
          ...orderData,
          items: detailsData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [PATCH] /api/orders/:id/items
   * Add items to existing UNSUBMIT order
   */
  addItemsToOrder = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { dishes } = req.body;

      if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "dishes array is required and must not be empty"
        });
      }

      const result = await this.ordersService.addItemsToExistingOrder(id, tenantId, dishes);

      // Clean response
      const { id: _oid, tenantId: _tid, ...orderData } = result.order;
      const newItemsData = result.newItems.map(item => {
        const { id, tenantId, orderId, ...rest } = item;
        return rest;
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          orderId: result.order.id,
          ...orderData,
          newItems: newItemsData
        }
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      if (error.message.includes("UNSUBMIT")) error.statusCode = 400;
      next(error);
    }
  }

}


export default OrdersController;