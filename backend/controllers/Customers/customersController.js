//backend/controllers/Customers/customersControllers.js

///<summary>
/// Controller quản lý các endpoint liên quan đến Customers
///</summary>

class CustomersController {
  constructor(customersService) {
    //inject constructor
    this.customersService = customersService;
  }

  // [POST] /api/customers/verify-qr?token=xxx&table=123
  verifyQR = async (req, res, next) => {
    try {
      const { token, table } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "QR token is required. Please scan the QR code.",
        });
      }

      // Giả lập xác thực token (trong thực tế cần kiểm tra DB hoặc JWT)
      // Ở đây chỉ cần trả về thông tin bàn
      return res.status(200).json({
        success: true,
        message: "QR code verified successfully",
        data: {
          tableNumber: table || "Không xác định",
          tableId: table,
          sessionToken: token,
        },
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [GET] /api/customers
  getAll = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;

      const onlyActive = req.query.active === "true";
      const data = await this.customersService.getCustomersByTenant(
        tenantId,
        onlyActive
      );
      const returnData = data.map((item) => {
        const { id, tenantId, ...rest } = item;

        return rest; // Chỉ trả về phần còn lại
      });
      return res.status(200).json({
        success: true,
        message: "Customers fetched successfully",
        total: returnData.length,
        data: returnData,
      });
    } catch (error) {
      next(error); // in middleware
    }
  };

  // [GET] /api/customers/:id
  getById = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const data = await this.customersService.getCustomerById(id, tenantId);
      //destructucting to remove sensitive info
      const { id: _id, tenantId: _tid, ...returnData } = data;
      return res.status(200).json({
        message: "Customer fetched successfully",
        success: true,
        total: returnData.length,
        data: returnData,
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      else if (error.message.includes("Access denied")) error.statusCode = 403;

      next(error);
    }
  };
  // for [POST] /api/customers/login
  customerLogin = async (req, res, next) => {
    const tenantId = req.tenantId;
    const { identifier, password } = req.body; // identifier can be email or phone
    
    try {
      // Validate input
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: "Email/Phone and password are required"
        });
      }

      // Try to find customer by email or phone
      const customer = await this.customersService.authenticateCustomer(
        tenantId,
        identifier,
        password
      );

      if (!customer) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials"
        });
      }

      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = customer;
      return res.status(200).json({
        message: "Login successful",
        success: true,
        data: returnData,
      });
    } catch (error) {
      if (error.message.includes("Invalid credentials") || error.message.includes("not found")) {
        return res.status(401).json({
          success: false,
          message: "Số điện thoại/Email hoặc mật khẩu không đúng"
        });
      }
      error.statusCode = 400;
      next(error);
    }
  };

  // [POST] /api/customers/register
  customerRegister = async (req, res, next) => {
    const tenantId = req.tenantId;
    const { phoneNumber, fullName, email, password } = req.body;
    
    try {
      // Validate required fields
      if (!phoneNumber || !fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (phoneNumber, fullName, email, password)"
        });
      }

      //Check if phoneNumber already exists
      const existingCustomer = await this.customersService.findCustomerByEmailOrPhone(
        tenantId,
        email,
        phoneNumber
      );

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message: "Phone number or email already registered"
        });
      }

      // Create new customer
      const newCustomer = await this.customersService.createCustomerWithAuth({
        tenantId,
        phoneNumber,
        fullName,
        email,
        password
      });

      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = newCustomer;
      return res.status(201).json({
        success: true,
        message: "Customer registered successfully",
        data: returnData
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [POST] /api/customers
  create = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      // Gọi Service
      const newCustomer = await this.customersService.createCustomer({
        ...req.body,
        tenantId: tenantId,
      });
      const { id: _id, tenantId: _tid, ...returnData } = newCustomer;
      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: returnData,
      });
    } catch (error) {
      // gán 400 để middleware biết không phải lỗi server sập
      error.statusCode = 400;
      next(error);
    }
  };

  // [PUT] /api/customers/:id
  update = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const updatedCustomer = await this.customersService.updateCustomer(
        id,
        tenantId,
        req.body
      );
      const { id: _id, tenantId: _tid, ...returnData } = updatedCustomer;
      return res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: returnData,
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  // [DELETE] /api/customers/:id
  delete = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      await this.customersService.deleteCustomer(id, tenantId);

      return res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };
}

export default CustomersController;
