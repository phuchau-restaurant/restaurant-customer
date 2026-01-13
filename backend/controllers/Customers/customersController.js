//backend/controllers/Customers/customersControllers.js
import { verifyOTP } from "../../helpers/otpHelper.js";

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
      // Handle account not verified
      if (error.code === "ACCOUNT_NOT_VERIFIED") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhập mã OTP.",
          code: "ACCOUNT_NOT_VERIFIED",
          email: error.email
        });
      }
      
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

  // [POST] /api/customers/verify-otp
  verifyOTP = async (req, res, next) => {
    const tenantId = req.tenantId;
    const { email, otp } = req.body;

    try {
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required"
        });
      }

      // Verify OTP using helper function  
      const otpHelper = await import("../../helpers/otpHelper.js");
      const result = otpHelper.verifyOTP(email, otp);
      
      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.reason === "OTP expired" 
            ? "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."
            : result.reason === "Too many failed attempts"
            ? "Quá nhiều lần thử. Vui lòng yêu cầu mã mới."
            : "Mã OTP không đúng. Vui lòng thử lại."
        });
      }

      // Activate customer account
      const customer = await this.customersService.activateCustomer(email, tenantId);

      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = customer;
      return res.status(200).json({
        success: true,
        message: "Xác thực thành công! Tài khoản đã được kích hoạt.",
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

  /**
   * [GET] /api/customers/profile/:customerId
   * Get customer profile by ID
   */
  getProfile = async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const { customerId } = req.params;

      const customer = await this.customersService.getCustomerById(customerId, tenantId);
      
      // Remove sensitive data
      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = customer;
      
      return res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: returnData,
      });
    } catch (error) {
      if (error.message.includes("not found")) error.statusCode = 404;
      else if (error.message.includes("Access denied")) error.statusCode = 403;
      next(error);
    }
  };

  /**
   * [PUT] /api/customers/profile/:customerId
   * Update customer profile (name, email, phone)
   */
  updateProfile = async (req, res, next) => {
    try {
       const tenantId = req.tenantId;
      const { customerId } = req.params;
      const { fullName, email, phoneNumber } = req.body;

      const updatedCustomer = await this.customersService.updateProfile(
        customerId,
        tenantId,
        { fullName, email, phoneNumber }
      );

      // Remove sensitive data
      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = updatedCustomer;

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: returnData,
      });
    } catch (error) {
      if (error.message.includes("already in use")) error.statusCode = 409;
      else error.statusCode = 400;
      next(error);
    }
  };

  /**
   * [PUT] /api/customers/password/:customerId
   * Change customer password
   */
  changePassword = async (req, res, next) => {
    try {
      const { customerId } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      await this.customersService.changePassword(
        customerId,
        currentPassword,
        newPassword
      );

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      if (error.message.includes("incorrect")) {
        error.statusCode = 401;
      } else {
        error.statusCode = 400;
      }
      next(error);
    }
  };

  /**
   * [PUT] /api/customers/avatar/:customerId
   * Update customer avatar
   */
  updateAvatar = async (req, res, next) => {
    try {
      const { customerId } = req.params;
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: "Avatar URL is required",
        });
      }

      const updatedCustomer = await this.customersService.updateAvatar(
        customerId,
        avatarUrl
      );

      // Remove sensitive data
      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = updatedCustomer;

      return res.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        data: returnData,
      });
    } catch (error) {
      error.statusCode = 400;
      next(error);
    }
  };

  /**
   * [POST] /api/customers/auth/google
   * Google Sign-In
   */
  googleAuth = async (req, res, next) => {
    const tenantId = req.tenantId;
    const { token } = req.body;

    try {
      if (!token) {
        return res.status(400).json({ message: "Google token is required" });
      }

      const customer = await this.customersService.authenticateWithGoogle(tenantId, token);

      const { id: _id, tenantId: _tid, password: _pwd, ...returnData } = customer;

      return res.status(200).json({
        success: true,
        message: "Google login successful",
        data: returnData
      });
    } catch (error) {
       error.statusCode = 400;
       next(error);
    }
  };
}

export default CustomersController;
