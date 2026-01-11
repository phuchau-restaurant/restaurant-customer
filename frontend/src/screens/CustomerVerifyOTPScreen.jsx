import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Utensils,
  Mail,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import AlertModal from "../components/Modal/AlertModal";
import { useAlert } from "../hooks/useAlert";

const CustomerVerifyOTPScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { alert, showSuccess, showError, closeAlert } = useAlert();

  const email = location.state?.email || "";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      showError("Email không hợp lệ. Vui lòng đăng ký lại.");
      setTimeout(() => navigate("/register"), 2000);
    }
  }, [email]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(newOtp);

    // Focus last filled input or last input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    setIsLoading(true);

    try {
      const tenantId = localStorage.getItem("tenantId");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/customers/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId || import.meta.env.VITE_TENANT_ID,
          },
          body: JSON.stringify({
            email: email,
            otp: otpCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Xác thực thất bại");
        setOtp(["", "", "", "", "", ""]); // Clear OTP
        inputRefs.current[0]?.focus();
        setIsLoading(false);
        return;
      }

      showSuccess("Xác thực thành công! Chuyển đến trang đăng nhập...");
      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        navigate(`/login${token ? `?token=${token}` : ""}`);
      }, 2000);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError("Không thể kết nối server!");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-orange-50 flex items-center justify-center p-4 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
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
        className="relative bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden max-w-md w-full border border-orange-100/50 z-10"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-block bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-full mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Mail className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Xác thực Email
            </h2>
            <p className="text-gray-600 text-sm">
              Chúng tôi đã gửi mã OTP đến email
            </p>
            <p className="text-orange-600 font-semibold mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium mb-1">💡 Lưu ý:</p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Mã OTP có hiệu lực trong 10 phút</li>
                <li>• Kiểm tra cả hộp thư spam nếu không thấy email</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className={`w-full py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                isLoading || otp.join("").length !== 6
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-[1.02]"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Xác thực</span>
                </>
              )}
            </button>

            {/* Back Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                to={`/register${window.location.search}`}
                className="text-sm text-gray-600 hover:text-orange-500 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                Quay lại đăng ký
              </Link>
            </div>
          </form>
        </div>
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

export default CustomerVerifyOTPScreen;
