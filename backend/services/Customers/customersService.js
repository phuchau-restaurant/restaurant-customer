import { isValidPhoneNumber, isValidFullName } from "../../helpers/validationHelper.js";
import bcrypt from "bcryptjs";
import emailService from "../emailService.js";
import { generateOTP, saveOTP, verifyOTP } from "../../helpers/otpHelper.js";
import { OAuth2Client } from "google-auth-library";
import storageService from "../Supabase/storageService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


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

    // Check if account is active
    if (!customer.isActive) {
      const error = new Error("Account not verified");
      error.code = "ACCOUNT_NOT_VERIFIED";
      error.email = customer.email;
      throw error;
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
       const isDuplicate = existing.some(cust => parseInt(cust.id) !== parseInt(id) && cust.phoneNumber === updates.phoneNumber.trim());
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
      isActive: false, // Set to false, require email verification
      loyaltyPoints: loyaltyPoints
    };
    
    const customer = await this.customerRepo.create(newCustomerData);

    // Generate and send OTP
    try {
      const otp = generateOTP();
      saveOTP(email.trim(), otp);
      await emailService.sendOTPEmail(email.trim(), otp, fullName.trim());
      console.log(`✅ OTP sent to ${email.trim()}: ${otp}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Don't fail registration if email fails, but log it
    }
    
    return customer;
  }

  /**
   * Activate customer account after OTP verification
   */
  async activateCustomer(email, tenantId) {
    if (!email) throw new Error("Email is required");
    if (!tenantId) throw new Error("Tenant ID is required");

    const customers = await this.customerRepo.findByEmail(tenantId, email.trim());
    if (!customers || customers.length === 0) {
      throw new Error("Customer not found");
    }

    const customer = customers[0];
    if (customer.isActive) {
      throw new Error("Account is already active");
    }

    // Update isActive to true
    const updated = await this.customerRepo.update(customer.id, { isActive: true });
    return updated;
  }

  /**
   * Update customer profile (name, email, phone)
   * @param {string} customerId 
   * @param {string} tenantId 
   * @param {object} profileData - { fullName, email, phoneNumber }
   */
  async updateProfile(customerId, tenantId, profileData) {
    if (!customerId) throw new Error("Customer ID is required");
    if (!tenantId) throw new Error("Tenant ID is required");

    // Get current customer to verify ownership
    const customer = await this.getCustomerById(customerId, tenantId);
    
    const updates = {};

    // Validate and prepare updates
    if (profileData.fullName !== undefined) {
      if (!profileData.fullName.trim()) {
        throw new Error("Full name cannot be empty");
      }
      if (!isValidFullName(profileData.fullName.trim())) {
        throw new Error("Invalid full name format");
      }
      updates.fullName = profileData.fullName.trim();
    }

    if (profileData.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email.trim())) {
        throw new Error("Invalid email format");
      }
      // Check if email is already used by another customer
      const existingByEmail = await this.customerRepo.findByEmail(tenantId, profileData.email.trim());
      const isDuplicate = existingByEmail.some(cust => parseInt(cust.id) !== parseInt(customerId));
      if (isDuplicate) {
        throw new Error("Email already in use");
      }
      updates.email = profileData.email.trim();
    }

    if (profileData.phoneNumber !== undefined) {
      if (!isValidPhoneNumber(profileData.phoneNumber.trim())) {
        throw new Error("Invalid phone number format");
      }
      // Check if phone is already used by another customer
      const existingByPhone = await this.customerRepo.findByPhoneNumber(tenantId, profileData.phoneNumber.trim());
      const isDuplicate = existingByPhone.some(cust => parseInt(cust.id) !== parseInt(customerId));
      if (isDuplicate) {
        throw new Error("Phone number already in use");
      }
      updates.phoneNumber = profileData.phoneNumber.trim();
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields to update");
    }

    return await this.customerRepo.update(customerId, updates);
  }

  /**
   * Change customer password
   * @param {string} customerId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  async changePassword(customerId, currentPassword, newPassword) {
    if (!customerId) throw new Error("Customer ID is required");
    if (!currentPassword) throw new Error("Current password is required");
    if (!newPassword) throw new Error("New password is required");

    // Get customer
    const customer = await this.customerRepo.getById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check if customer has a password set
    if (!customer.password) {
      throw new Error("This account was not registered with a password");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    return await this.customerRepo.update(customerId, { password: hashedPassword });
  }

  /**
   * Update customer avatar URL
   * @param {string} customerId 
   * @param {string} avatarUrl 
   */
  async updateAvatar(customerId, avatarUrl) {
    if (!customerId) throw new Error("Customer ID is required");
    if (!avatarUrl) throw new Error("Avatar URL is required");

    const customer = await this.customerRepo.getById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Delete old avatar if exists and is hosted on our storage
    if (customer.avatar && customer.avatar.includes("restaurant-assets")) {
      try {
          await storageService.deleteByUrl(customer.avatar);
          console.log("Deleted old avatar:", customer.avatar);
      } catch (e) {
          console.error("Failed to delete old avatar but proceeding:", e.message);
      }
    }

    return await this.customerRepo.update(customerId, { avatar: avatarUrl });
  }

  /**
   * Request OTP for password reset
   * @param {string} email
   */
  async requestPasswordResetOTP(email) {
    if (!email) throw new Error("Email is required");

    // Tìm customer từ email (toàn hệ thống, không cần tenantId)
    const customers = await this.customerRepo.findByEmailGlobal(email.trim());
    if (!customers || customers.length === 0) {
      throw new Error("Email không tồn tại trong hệ thống");
    }

    const otp = generateOTP();
    await saveOTP(email.trim(), otp);

    const customer = customers[0];

    try {
      await emailService.sendPasswordResetEmail(email.trim(), otp, customer.fullName || "Quý khách");
      console.log(`✅ Password Reset OTP sent to ${email.trim()}`);
    } catch (error) {
       console.error("Send OTP Error:", error);
       throw new Error("Không thể gửi email OTP. Vui lòng thử lại sau.");
    }
    
    return true;
  }

  /**
   * Reset password using Verified OTP
   * @param {string} email
   * @param {string} otp
   * @param {string} newPassword
   */
  async resetPasswordWithOTP(email, otp, newPassword) {
    if (!email || !otp || !newPassword) throw new Error("Thiếu thông tin");

    // 1. Verify OTP
    const verification = await verifyOTP(email.trim(), otp);
    if (!verification || !verification.valid) {
      throw new Error(verification?.reason || "Mã OTP không chính xác hoặc đã hết hạn");
    }

    // 2. Find Customer (toàn hệ thống, không cần tenantId)
    const customers = await this.customerRepo.findByEmailGlobal(email.trim());
    if (!customers || customers.length === 0) {
      throw new Error("Email không tồn tại");
    }
    const customer = customers[0];

    // 3. Hash new password
    if (newPassword.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    return await this.customerRepo.update(customer.id, { 
      password: hashedPassword,
      isActive: true 
    });
  }

  /**
   * Verify OTP only (for Password Reset flow)
   */
  async verifyOTPOnly(email, otp) {
    if (!email || !otp) throw new Error("Missing email or OTP");
    // Pass true to keep OTP for the next step (reset password)
    const verification = await verifyOTP(email.trim(), otp, true);
    if (!verification || !verification.valid) {
      throw new Error(verification?.reason || "Mã OTP không chính xác");
    }
    return true;
  }

  /**
   * Authenticate OR Register customer with Google
   * @param {string} tenantId 
   * @param {string} token - Google ID Token
   */
  /**
   * Update customer avatar URL
   * @param {string} customerId 
   * @param {string} avatarUrl 
   */
  async updateAvatar(customerId, avatarUrl) {
    if (!customerId) throw new Error("Customer ID is required");
    if (!avatarUrl) throw new Error("Avatar URL is required");

    const customer = await this.customerRepo.getById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Delete old avatar if exists and is hosted on our storage
    if (customer.avatar && customer.avatar.includes("restaurant-assets")) {
      try {
          await storageService.deleteByUrl(customer.avatar);
          console.log("Deleted old avatar:", customer.avatar);
      } catch (e) {
          console.error("Failed to delete old avatar but proceeding:", e.message);
      }
    }

    return await this.customerRepo.update(customerId, { avatar: avatarUrl });
  }

  async authenticateWithGoogle(tenantId, token) {
    if (!tenantId) throw new Error("Tenant ID is required");
    if (!token) throw new Error("Google Token is required");

    try {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID, 
      });
      const payload = ticket.getPayload();
      const { email, name, picture, sub: googleId } = payload; // sub is the unique Google ID

      // 1. Try to find by Google ID first
      let customers = await this.customerRepo.findByGoogleId(tenantId, googleId);
      let customer = customers[0];

      // 2. If not found, try to find by Email
      if (!customer) {
        const customersByEmail = await this.customerRepo.findByEmail(tenantId, email);
        customer = customersByEmail[0];
        
        // If found by email, link Google ID and Avatar
        if (customer) {
           await this.customerRepo.update(customer.id, { 
             googleId: googleId,
             avatar: picture // Update avatar from Google
           });
           customer.googleId = googleId;
           customer.avatar = picture;
        }
      }

      // 3. If still not found, Create new user
      if (!customer) {
        // Create a unique placeholder phone number since it's required
        const placeholderPhone = `G-${Date.now().toString().slice(-9)}`;
        
        const newCustomerData = {
          tenantId,
          fullName: name,
          email: email,
          googleId: googleId,
          avatar: picture,
          isActive: true, // Google users are verified implicitly
          phoneNumber: placeholderPhone, 
          password: null, 
          loyaltyPoints: 0
        };
        customer = await this.customerRepo.create(newCustomerData);
      }

      return customer;
      
    } catch (error) {
      console.error("Google Auth Error:", error);
      throw new Error("Google authentication failed: " + error.message);
    }
  }
}

export default CustomersService; 