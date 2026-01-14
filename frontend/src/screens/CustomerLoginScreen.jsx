import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCustomer } from "../contexts/CustomerContext";
import { motion } from "framer-motion";
import GoogleLoginButton from "../components/Auth/GoogleLoginButton";
import {
  Utensils,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  Coffee,
  Cookie,
  UtensilsCrossed,
  ChefHat,
  Pizza,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import AlertModal from "../components/Modal/AlertModal";
import { useAlert } from "../hooks/useAlert";

const CustomerLoginScreen = () => {
  const navigate = useNavigate();
  const { login, updateTable } = useCustomer();
  const { alert, showError, showWarning, closeAlert } = useAlert();

  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [qrToken, setQrToken] = useState(null);

  // Kiểm tra và xác thực QR token với server
  React.useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      // Check if dev mode is enabled
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

      if (isDevMode) {
        console.log("🚀 DEV MODE: Bypassing QR token verification");
        setTokenVerified(true);
        
        // Set mock table info for development
        const mockTableInfo = {
          tableId: 1, // Changed to integer for database compatibility
          tableNumber: "Bàn DEV #1",
        };
        
        setTableInfo(mockTableInfo);
        updateTable({
          id: mockTableInfo.tableId,
          number: mockTableInfo.tableNumber,
        });

        // Use default tenant ID from env
        if (import.meta.env.VITE_TENANT_ID) {
          localStorage.setItem("tenantId", import.meta.env.VITE_TENANT_ID);
        }
        
        return;
      }

      if (!token) {
        showWarning("Vui lòng quét mã QR để truy cập!");
        setTokenVerified(false);
        return;
      }

      try {

        // Call API to verify token
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tokens/verify-qr`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Token invalid or expired
          showError(
            data.message || "QR code không hợp lệ. Vui lòng quét mã QR mới từ nhà hàng."
          );
          setTokenVerified(false);
          return;
        }

        // Token is valid
        setQrToken(token);
        setTokenVerified(true);

        // Set table info from verified token
        setTableInfo({
          tableId: data.data.tableId,
          tableNumber: data.data.tableNumber,
        });
        
        updateTable({
          id: data.data.tableId,
          number: data.data.tableNumber,
        });

        // Save tenantId to localStorage
        if (data.data.tenantId) {
          localStorage.setItem("tenantId", data.data.tenantId);
        }
      } catch (error) {
        console.error("Token verification error:", error);
        showError("Không thể xác thực QR code. Vui lòng thử lại.");
        setTokenVerified(false);
      }
    };

    verifyToken();
  }, []);

  const validateIdentifier = (value) => {
    // Check if it's an email
    if (value.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    // Check if it's a phone number
    const phoneRegex = /^0\d{9,10}$/;
    return phoneRegex.test(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateIdentifier(identifier)) {
      setError("Vui lòng nhập email hợp lệ hoặc số điện thoại (bắt đầu bằng 0, dài 10-11 số)");
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const tenantId = localStorage.getItem("tenantId");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/customers/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId || import.meta.env.VITE_TENANT_ID,
          },
          body: JSON.stringify({
            identifier: identifier,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if account is not verified
        if (data.code === "ACCOUNT_NOT_VERIFIED") {
          setError(data.message + " Bạn có thể đăng ký lại để nhận mã OTP mới.");
        } else {
          showError(data.message || "Đăng nhập thất bại");
        }
        setIsLoading(false);
        return;
      }

      // Trigger exit animation
      setIsExiting(true);

      setTimeout(() => {
        login(data.data);
        navigate("/menu");
      }, 800);
    } catch (error) {
      console.error("Login error:", error);
      showError("Không thể kết nối server!");
      setIsLoading(false);
    }
  };

  // --- RENDER ---

  if (!tokenVerified) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            {alert.isOpen && alert.type === "error" ? (
              // Error State - Invalid Token
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-8"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <span className="text-4xl">⚠️</span>
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {alert.title}
                </h2>
                <p className="text-gray-600 mb-6">{alert.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Quét lại mã QR
                </button>
              </motion.div>
            ) : (
              // Loading State - Verifying Token
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                <p className="text-xl font-semibold text-orange-600 mb-2">
                  Đang xác thực QR code...
                </p>
                {tableInfo && (
                  <p className="text-sm text-gray-600">
                    {tableInfo.tableNumber}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Alert Modal */}
        <AlertModal
          isOpen={alert.isOpen}
          onClose={() => {
            closeAlert();
          }}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
      </>
    );
  }

  // Cấu hình animation "Bay bay" (Floating)
  const floatingVariant = (delay) => ({
    animate: {
      y: [0, -20, 0, 15, 0], // Di chuyển dọc phức tạp hơn
      x: [0, 10, 0, -10, 0], // Di chuyển ngang nhẹ
      rotate: [0, 5, -5, 3, 0], // Xoay nhẹ
      transition: {
        duration: 5 + Math.random() * 2, // Thời gian ngẫu nhiên từ 5-7s
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      },
    },
  });

  return (
    <motion.div
      className="min-h-screen bg-orange-50 flex items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.2 }}
      transition={{ duration: 0.7 }}
    >
      {/* Background Blobs - Di chuyển chậm và mượt hơn */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={
            isExiting
              ? { scale: 0, opacity: 0, rotate: 180, x: 0, y: 0 }
              : { x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }
          }
          transition={
            isExiting
              ? { duration: 0.8, ease: "easeInOut" }
              : { duration: 15, repeat: Infinity, ease: "linear" }
          }
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={
            isExiting
              ? { scale: 0, opacity: 0, rotate: -180, x: 0, y: 0 }
              : { x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }
          }
          transition={
            isExiting
              ? { duration: 0.8, ease: "easeInOut" }
              : { duration: 18, repeat: Infinity, ease: "linear" }
          }
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        className="relative bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 border border-orange-100/50 z-10"
        animate={
          isExiting
            ? {
                scale: 0,
                opacity: 0,
                rotate: 360,
                filter: "blur(10px)",
              }
            : { scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }
        }
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* LEFT - Visual Animation Zone */}
        <motion.div
          className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 flex items-center justify-center p-12 overflow-hidden min-h-[500px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Vòng tròn lan tỏa (Pulse) phía sau logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-64 h-64 bg-white rounded-full absolute"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.05, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              className="w-96 h-96 bg-white rounded-full absolute"
            />
          </div>

          {/* --- CÁC MÓN ĂN BAY BAY (Floating Icons) --- */}
          {/* Icon 1: Utensils - Góc trên trái */}
          <motion.div
            className="absolute top-16 left-12 text-white/40"
            variants={floatingVariant(0)}
            animate="animate"
          >
            <Utensils className="w-16 h-16 drop-shadow-md" />
          </motion.div>

          {/* Icon 2: Coffee - Góc trên phải */}
          <motion.div
            className="absolute top-24 right-16 text-white/30"
            variants={floatingVariant(1.5)}
            animate="animate"
          >
            <Coffee className="w-14 h-14 drop-shadow-md" />
          </motion.div>

          {/* Icon 3: Cookie - Góc dưới trái */}
          <motion.div
            className="absolute bottom-24 left-20 text-white/40"
            variants={floatingVariant(0.5)}
            animate="animate"
          >
            <Cookie className="w-12 h-12 drop-shadow-md" />
          </motion.div>

          {/* Icon 4: UtensilsCrossed - Góc dưới phải */}
          <motion.div
            className="absolute bottom-32 right-24 text-white/30"
            variants={floatingVariant(2)}
            animate="animate"
          >
            <UtensilsCrossed className="w-16 h-16 drop-shadow-md" />
          </motion.div>

          {/* Icon 5: Pizza - Giữa trái (Thêm mới cho sinh động) */}
          <motion.div
            className="absolute top-1/2 left-8 text-white/20"
            variants={floatingVariant(1)}
            animate="animate"
          >
            <Pizza className="w-10 h-10 drop-shadow-md" />
          </motion.div>

          {/* Icon 6: ChefHat - Giữa phải (Thêm mới) */}
          <motion.div
            className="absolute bottom-1/3 right-8 text-white/20"
            variants={floatingVariant(2.5)}
            animate="animate"
          >
            <ChefHat className="w-12 h-12 drop-shadow-md" />
          </motion.div>

          {/* Sparkles - Lấp lánh ngẫu nhiên */}
          <motion.div
            className="absolute top-1/3 left-1/3 text-yellow-200"
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>

          {/* CENTRAL LOGO */}
          <motion.div
            className="relative z-10"
            layoutId="app-logo"
            animate={
              isExiting ? { rotate: 360, scale: 0.5 } : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="relative inline-block group">
              {/* Glow effect */}
              <motion.div
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white/20 rounded-full blur-2xl"
              />

              {/* Main icon container */}
              <div className="relative bg-white p-10 rounded-full shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                <Utensils className="w-28 h-28 text-orange-500" />
              </div>
            </div>

            {/* Chấm tròn loading trang trí bên dưới */}
            <div className="flex justify-center gap-3 mt-10">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 0.2,
                }}
                className="w-3 h-3 bg-white/90 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.2,
                  repeatDelay: 0.2,
                }}
                className="w-3 h-3 bg-white/90 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: 0.4,
                  repeatDelay: 0.2,
                }}
                className="w-3 h-3 bg-white/90 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT - Login Form */}
        <motion.div
          className="p-12 flex flex-col justify-center bg-white relative"
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Trang trí góc phải */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full opacity-50 pointer-events-none"></div>

          <div className="max-w-md mx-auto w-full space-y-8">
            {/* Header */}
            <motion.div
              className="text-center space-y-2 py-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-3xl font-bold text-gray-800 tracking-tight">
                Kính chào quý khách
              </h3>
              <p className="text-gray-500">Mời quý khách nhập thông tin</p>
              {tableInfo && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 px-5 py-2 rounded-full text-sm font-bold shadow-sm"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                  {tableInfo.tableNumber}
                </motion.div>
              )}
            </motion.div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email or Phone Input */}
              <motion.div
                className="space-y-2 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-md font-semibold text-gray-700 flex items-center gap-2 pl-1">
                  <Mail className="w-4 h-4 text-orange-500" />
                  Email hoặc Số điện thoại
                </label>
                <div className="relative overflow-hidden rounded-xl">
                  <input
                    type="text"
                    className="w-full border-2 border-gray-100 bg-gray-50 px-5 py-4 text-lg focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none placeholder:text-gray-300"
                    placeholder="email@example.com hoặc 0123456789"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                className="space-y-2 group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-md font-semibold text-gray-700 flex items-center gap-2 pl-1">
                  <Lock className="w-4 h-4 text-orange-500" />
                  Mật khẩu
                </label>
                <div className="relative overflow-hidden rounded-xl">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border-2 border-gray-100 bg-gray-50 px-5 py-4 pr-12 text-lg focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 outline-none placeholder:text-gray-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-500 hover:text-orange-500 transition-colors font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </motion.div>

              {/* ERROR MESSAGE */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  {error}
                </motion.div>
              )}

              {/* BUTTON */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 flex items-center justify-center gap-3 transition-all duration-300 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Bắt đầu đặt món</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc</span>
                  </div>
                </div>

                <GoogleLoginButton />
            </form>

            {/* Register Link */}
            <motion.div
              className="text-center pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-gray-600">
                Bạn chưa có tài khoản?{" "}
                <Link
                  to={`/register${window.location.search}`}
                  className="text-orange-500 font-semibold hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="text-center pt-4 border-t border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-orange-400 text-xs font-semibold tracking-wider uppercase">
                Powered by HDV Team
              </p>
            </motion.div>
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

export default CustomerLoginScreen;
