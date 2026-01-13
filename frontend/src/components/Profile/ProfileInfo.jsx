import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Mail,
  Phone,
  Lock,
  User,
  Save,
  Edit2,
  Upload,
  X,
  CheckCircle,
} from "lucide-react";
import uploadService from "../../services/uploadService";
import * as customerProfileService from "../../services/customerProfileService";
import { useCustomer } from "../../contexts/CustomerContext";

const ProfileInfo = ({ customer, currentAvatar }) => {
  const { login } = useCustomer(); // Get login function to update customer context
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Helper function to get customer ID
  const getCustomerId = () => {
    const id = customer?.customerId || customer?.id;
    console.log("Customer object:", customer);
    console.log("Extracted customer ID:", id);
    return id;
  };

  // Safe data extraction handling different field names
  const getCustomerData = (data) => ({
    name: data?.name || data?.fullName || data?.full_name || "",
    email: data?.email || "",
    phone: data?.phone || data?.phoneNumber || data?.phone_number || "",
  });

  const [formData, setFormData] = useState(getCustomerData(customer));

  // Sync state when customer prop changes
  React.useEffect(() => {
    if (customer) {
      setFormData(getCustomerData(customer));
      // Update avatar if not already set by user interaction
      if (!customer.avatar && currentAvatar) {
        setAvatarPreview(currentAvatar);
      } else if (customer.avatar) {
        setAvatarPreview(customer.avatar);
      }
    }
  }, [customer, currentAvatar]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(
    customer?.avatar || currentAvatar || "/images/avatar/default_avt.svg"
  );

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File quá lớn. Kích thước tối đa 10MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");

      // Preview locally first
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const customerId = getCustomerId();
      const response = await uploadService.uploadSingle(
        file,
        "avatars", // folder
        `avatar_${customerId || Date.now()}` // custom filename
      );

      if (response.data && response.data.url) {
        const newAvatarUrl = response.data.url;
        setAvatarPreview(newAvatarUrl);

        // Update avatar in database
        const tenantId = localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;
        const updatedCustomer = await customerProfileService.updateCustomerAvatar(
          customerId,
          tenantId,
          newAvatarUrl
        );

        // Update customer context with new avatar
        login({ ...customer, avatar: newAvatarUrl });

        console.log("Avatar uploaded and updated successfully:", newAvatarUrl);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      setUploadError(error.message || "Lỗi upload ảnh");
      // Revert preview on error
      setAvatarPreview(
        customer?.avatar || currentAvatar || "/images/avatar/default_avt.svg"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaveError("");
      setSaveSuccess("");

      // Validate
      if (!formData.name || !formData.email || !formData.phone) {
        setSaveError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      const customerId = getCustomerId();
      if (!customerId) {
        setSaveError(
          "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại."
        );
        return;
      }

      const tenantId = localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;

      // Call API to update profile
      const updatedProfile = await customerProfileService.updateCustomerProfile(customerId, tenantId, {
        fullName: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
      });

      // Update avatar nếu đã thay đổi
      if (
        avatarPreview !== customer?.avatar &&
        avatarPreview !== currentAvatar
      ) {
        await customerProfileService.updateCustomerAvatar(
          customerId,
          tenantId,
          avatarPreview
        );
      }

      // Update customer context with new data
      login({
        ...customer,
        customerId: customerId,
        fullName: formData.name,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        avatar: avatarPreview,
      });

      setSaveSuccess("Cập nhật thông tin thành công!");
      setIsEditing(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (error) {
      console.error("Save profile error:", error);
      setSaveError(error.message || "Lỗi cập nhật thông tin");
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordError("");
      setPasswordSuccess("");

      // Validate
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        setPasswordError("Vui lòng điền đầy đủ thông tin");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("Mật khẩu mới không khớp");
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }

      const customerId = getCustomerId();
      if (!customerId) {
        setPasswordError(
          "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại."
        );
        return;
      }

      const tenantId = localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;

      // Call API to change password
      await customerProfileService.changeCustomerPassword(
        customerId,
        tenantId,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setPasswordSuccess("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError(error.message || "Lỗi đổi mật khẩu");
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex flex-col items-center">
          <div className="relative group">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-orange-100"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <label
              className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                isUploading ? "pointer-events-none" : ""
              }`}
            >
              <Upload className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
          {uploadError && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <X className="w-4 h-4" />
              {uploadError}
              <button
                onClick={() => setUploadError("")}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-800 mt-4">
            {customer?.name}
          </h3>
          <p className="text-sm text-gray-500">
            Điểm tích lũy: {customer?.loyaltyPoints || 0}
          </p>
        </div>
      </motion.div>

      {/* Profile Info */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Thông tin cá nhân
          </h4>
          {!isEditing ? (
            <button
              onClick={() => {
                setIsEditing(true);
                setSaveError("");
                setSaveSuccess("");
              }}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Chỉnh sửa
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSaveError("");
                  setSaveSuccess("");
                }}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            {saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <X className="w-4 h-4" />
            {saveError}
            <button
              onClick={() => setSaveError("")}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-orange-500" />
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                isEditing
                  ? "border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              } outline-none`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 text-orange-500" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                isEditing
                  ? "border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              } outline-none`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-orange-500" />
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                isEditing
                  ? "border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              } outline-none`}
            />
          </div>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Đổi mật khẩu</h4>
          {!isChangingPassword && (
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setPasswordError("");
                setPasswordSuccess("");
              }}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <Lock className="w-4 h-4" />
              Thay đổi
            </button>
          )}
        </div>

        {/* Password Success/Error Messages */}
        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <X className="w-4 h-4" />
            {passwordError}
            <button
              onClick={() => setPasswordError("")}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isChangingPassword ? (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-medium"
              >
                Xác nhận
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">••••••••</p>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileInfo;
