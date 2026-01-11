import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Utensils,
  Phone,
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import AlertModal from "../components/Modal/AlertModal";
import { useAlert } from "../hooks/useAlert";

const CustomerRegisterScreen = () => {
  const navigate = useNavigate();
  const { alert, showSuccess, showError, closeAlert } = useAlert();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập tên của bạn";
    }

    // Validate phone
    const phoneRegex = /^0\d{9,10}$/;
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại phải bắt đầu bằng 0 và dài 10-11 số";
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const tenantId = localStorage.getItem("tenantId");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/customers/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId || import.meta.env.VITE_TENANT_ID,
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showError(data.message || "Đăng ký thất bại");
        setIsLoading(false);
        return;
      }

      showSuccess("Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.");
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        navigate(`/verify-otp${token ? `?token=${token}` : ""}`, {
          state: { email: formData.email }
        });
      }, 2000);
    } catch (error) {
      console.error("Register error:", error);
      showError("Không thể kết nối server!");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-orange-50 flex items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        className="relative bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 border border-orange-100/50 z-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* LEFT - Visual */}
        <motion.div
          className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 flex items-center justify-center p-12 overflow-hidden min-h-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="relative z-10 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="bg-white p-8 rounded-full shadow-2xl inline-block mb-6">
                <Utensils className="w-20 h-20 text-orange-500" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Chào mừng!</h2>
            <p className="text-white/90 text-lg">
              Đăng ký tài khoản để trải nghiệm dịch vụ của chúng tôi
            </p>
          </div>
        </motion.div>

        {/* RIGHT - Register Form */}
        <motion.div
          className="p-12 flex flex-col justify-center bg-white relative"
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold text-gray-800">Đăng ký</h3>
              <p className="text-gray-500">Tạo tài khoản mới</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  className={`w-full border-2 ${
                    errors.fullName ? "border-red-300" : "border-gray-100"
                  } bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none rounded-xl`}
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs">{errors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-500" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  className={`w-full border-2 ${
                    errors.phoneNumber ? "border-red-300" : "border-gray-100"
                  } bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none rounded-xl`}
                  placeholder="0123 456 789"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className={`w-full border-2 ${
                    errors.email ? "border-red-300" : "border-gray-100"
                  } bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none rounded-xl`}
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-500" />
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`w-full border-2 ${
                      errors.password ? "border-red-300" : "border-gray-100"
                    } bg-gray-50 px-4 py-3 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none rounded-xl`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-500" />
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={`w-full border-2 ${
                      errors.confirmPassword ? "border-red-300" : "border-gray-100"
                    } bg-gray-50 px-4 py-3 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none rounded-xl`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-3 transition-all duration-300 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:scale-[1.02]"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link
                  to={`/login${window.location.search}`}
                  className="text-orange-500 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </motion.div>
  );
};

export default CustomerRegisterScreen;
