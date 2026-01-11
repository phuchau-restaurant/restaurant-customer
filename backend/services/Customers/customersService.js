// backend/services/Customers/customersService.js
import { isValidPhoneNumber } from "../../helpers/validationHelper.js"; 
import{ isValidFullName } from "../../helpers/validationHelper.js";
import bcrypt from "bcryptjs";

class CustomersService {
  constructor(customerRepository) {
    this.customerRepo = customerRepository;
  }

  /**
   * Lấy danh sách danh mục của một nhà hàng (Tenant)
   * @param {string} tenantId - ID của nhà hàng (Bắt buộc)
   * @param {boolean} onlyActive - Nếu true, chỉ lấy danh mục đang hoạt động
   */
  async getCustomersByTenant(tenantId, onlyActive = false) {
    if (!tenantId) throw new Error("Missing tenantId");

    const filters = { tenant_id: tenantId }; 
    
    if (onlyActive) {
      filters.is_active = true;
    }
   
    return await this.customerRepo.getAll(filters);
  }

  /**
   * Tạo danh mục mới
   * - Rule 1: Tên không được để trống
   * - Rule 2: Tên không được trùng trong cùng 1 Tenant
   */
  async createCustomer({ tenantId, phoneNumber, fullName ,loyaltyPoints = 0 }) {

    if (!tenantId) throw new Error("Tenant ID is required");
    if (!fullName || fullName.trim() === "") throw new Error("Customer full name is required");
    if (!phoneNumber || phoneNumber.trim() === "") throw new Error("Customer phone number is required");
    if (isNaN(loyaltyPoints) || loyaltyPoints < 0) { loyaltyPoints = 0; }

    //Business rule
    if (!isValidPhoneNumber(phoneNumber.trim())) {
      throw new Error("Invalid phone number format");
    }
    if (!isValidFullName(fullName.trim())) {
      throw new Error("Invalid full name format");
    }

    const existing = await this.customerRepo.findByPhoneNumber(tenantId, phoneNumber.trim());
    if (existing && existing.length > 0) {
      const isExactMatch = existing
            .some(cust => cust.phoneNumber === phoneNumber.trim());
      if (isExactMatch) {
        throw new Error(`Customer with phone number '${phoneNumber.trim()}' already exists in this tenant`);
      }
    }
    
    const newCustomerData = {
      tenantId: tenantId,         
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      loyaltyPoints: loyaltyPoints          
    };
    return await this.customerRepo.create(newCustomerData);
  }

  /**
   * @param {string} id - ID danh mục
   * @param {string} tenantId - ID nhà hàng (Dùng để verify quyền sở hữu)
   */
  async getCustomerById(id, tenantId) {
    if (!id) throw new Error("Customer ID is required");

    const customer = await this.customerRepo.getById(id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    if (tenantId && customer.tenantId !== tenantId) { 
      throw new Error("Access denied: Customer belongs to another tenant");
    }
    return customer;
  }

  async findCustomerByPhoneNumber(tenantId, phoneNumber) {
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!phoneNumber || phoneNumber.trim() === "") throw new Error("Customer phone number is required");

    const customers = await this.customerRepo.findByPhoneNumber(tenantId, phoneNumber.trim());
    if (!customers || customers.length === 0) {
      throw new Error("Customer not found");
    }
    if (tenantId && customers[0].tenantId !== tenantId) { 
      throw new Error("Access denied: Customer belongs to another tenant");
    }
    return customers[0]; //model - entity
  }

  /**
   * Authenticate customer with email/phone and password
   * @param {string} tenantId 
   * @param {string} identifier - Email or phone number
   * @param {string} password 
   */
  async authenticateCustomer(tenantId, identifier, password) {
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!identifier || identifier.trim() === "") throw new Error("Email or phone number is required");
    if (!password) throw new Error("Password is required");

    let customer = null;

    // Check if identifier is email (contains @)
    if (identifier.includes("@")) {
      const customersByEmail = await this.customerRepo.findByEmail(tenantId, identifier.trim());
      if (customersByEmail && customersByEmail.length > 0) {
        customer = customersByEmail[0];
      }
    } else {
      // Assume it's a phone number
      const customersByPhone = await this.customerRepo.findByPhoneNumber(tenantId, identifier.trim());
      if (customersByPhone && customersByPhone.length > 0) {
        customer = customersByPhone[0];
      }
    }

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check if customer has a password (registered with email/password)
    if (!customer.password) {
      throw new Error("This account was not registered with a password. Please use QR code login.");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    return customer;
  }

  /**
   * Cập nhật 
   * Bắt buộc customer cần có số điện thoại
   */
  async updateCustomer(id, tenantId, updates) {
    await this.getCustomerById(id, tenantId); //throw error if not found

    if (updates.phoneNumber) {
        //Business rule
        if (!isValidPhoneNumber(updates.phoneNumber.trim())) {
        throw new Error("Invalid phone number format");
        }
        if (!isValidFullName(updates.fullName.trim())) {
        throw new Error("Invalid full name format");
        }

       const existing = await this.customerRepo.findByPhoneNumber(tenantId, updates.phoneNumber.trim());
       const isDuplicate = existing.some(cust => cust.id !== id && cust.phoneNumber === updates.phoneNumber.trim());
       if (isDuplicate) {
         throw new Error(`Customer with phone number '${updates.phoneNumber}' already exists`);
       }
    }

    return await this.customerRepo.update(id, updates);
  }


  async deleteCustomer(id, tenantId) {
    await this.getCustomerById(id, tenantId);
    return await this.customerRepo.delete(id);
  }

  /**
   * Find customer by email or phone number
   * @param {string} tenantId 
   * @param {string} email 
   * @param {string} phoneNumber 
   */
  async findCustomerByEmailOrPhone(tenantId, email, phoneNumber) {
    if (!tenantId) throw new Error("Tenant ID is required");
    
    // Try to find by phone first
    if (phoneNumber) {
      const customersByPhone = await this.customerRepo.findByPhoneNumber(tenantId, phoneNumber.trim());
      if (customersByPhone && customersByPhone.length > 0) {
        return customersByPhone[0];
      }
    }
    
    // Then try by email (if your repository supports it)
    if (email) {
      const customersByEmail = await this.customerRepo.findByEmail(tenantId, email.trim());
      if (customersByEmail && customersByEmail.length > 0) {
        return customersByEmail[0];
      }
    }
    
    return null;
  }

  /**
   * Create customer with email and password authentication
   */
  async createCustomerWithAuth({ tenantId, phoneNumber, fullName, email, password, loyaltyPoints = 0 }) {
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!fullName || fullName.trim() === "") throw new Error("Customer full name is required");
    if (!phoneNumber || phoneNumber.trim() === "") throw new Error("Customer phone number is required");
    if (!email || email.trim() === "") throw new Error("Email is required");
    if (!password || password.trim() === "") throw new Error("Password is required");
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email format");
    }

    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber.trim())) {
      throw new Error("Invalid phone number format");
    }
    
    // Validate full name
    if (!isValidFullName(fullName.trim())) {
      throw new Error("Invalid full name format");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newCustomerData = {
      tenantId: tenantId,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      password: hashedPassword,
      loyaltyPoints: loyaltyPoints
    };
    
    return await this.customerRepo.create(newCustomerData);
  }
}

export default CustomersService; 