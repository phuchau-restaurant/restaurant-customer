import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Check, ArrowLeft, Key } from 'lucide-react';
import { useAlert } from '../hooks/useAlert';
import AlertModal from '../components/Modal/AlertModal';

const CustomerForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, alert, closeAlert } = useAlert();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  // --- STEP 1: REQUEST OTP ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      showError("Vui lòng nhập email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': import.meta.env.VITE_TENANT_ID,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi OTP");
      }

      showSuccess("Đã gửi mã OTP đến email của bạn!");
      setStep(2);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP & RESET PASSWORD (Actually done in Step 3 button, but here we just collect OTP) ---
  // Wait, the API reset-password takes OTP + New Password. 
  // So Step 2 is collecting OTP. Step 3 is collecting Password. 
  // We can combine Step 2 & 3 or Verify OTP first locally? 
  // API design: resetPassword takes (email, otp, newPass).
  // So at step 2 (OTP), if we press "Next", we just go to Step 3.
  // OR we verify OTP first? But we don't have separate verify endpoint for reset.
  // Let's assume we collect OTP -> Go to Step 3 -> Call API.
  
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const moveToStep3 = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showError("Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    // Verify OTP first
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/customers/verify-reset-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': import.meta.env.VITE_TENANT_ID,
            },
            body: JSON.stringify({ email, otp: otpCode }),
        });
        
        const data = await response.json();
        
        if(!response.ok) {
            throw new Error(data.message || "Mã OTP không chính xác");
        }
        
        // OTP valid -> Move to step 3
        setStep(3);
    } catch(err) {
        showError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  // --- STEP 3: SUBMIT NEW PASSWORD ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 6) {
      showError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      const otpCode = otp.join('');
      const response = await fetch(`${API_BASE_URL}/api/customers/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': import.meta.env.VITE_TENANT_ID,
        },
        body: JSON.stringify({ 
          email, 
          otp: otpCode, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đặt lại mật khẩu thất bại");
      }

      showSuccess("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      setTimeout(() => navigate('/login'), 1500);

    } catch (error) {
       // Nếu lỗi OTP, có thể quay lại bước 2?
       if(error.message.includes("OTP")) {
          setStep(2);
       }
       showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sm:mx-auto sm:w-full sm:max-w-md w-full"
      >
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden">
          {/* Decorative Header */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500" />
          
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {step === 1 && "Quên mật khẩu?"}
              {step === 2 && "Nhập mã xác thực"}
              {step === 3 && "Tạo mật khẩu mới"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              {step === 1 && "Nhập email để nhận mã OTP khôi phục mật khẩu"}
              {step === 2 && `Mã OTP đã được gửi đến ${email}`}
              {step === 3 && "Nhập mật khẩu mới cho tài khoản của bạn"}
            </p>
          </div>

          <form className="space-y-6" onSubmit={step === 1 ? handleRequestOTP : step === 2 ? moveToStep3 : handleResetPassword}>
            
            <AnimatePresence mode="wait">
              {/* STEP 1: EMAIL */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email của bạn</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-base sm:text-sm transition-all"
                      placeholder="vidu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: OTP */}
              {step === 2 && (
                 <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                 >
                    <div className="flex justify-between gap-1 sm:gap-2 mb-4">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          inputMode="numeric"
                          className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gray-200 rounded-lg sm:rounded-xl text-center text-lg sm:text-xl font-bold focus:border-orange-500 focus:ring-2 sm:focus:ring-4 focus:ring-orange-100 outline-none transition-all p-0"
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onFocus={(e) => e.target.select()}
                        />
                      ))}
                    </div>
                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => setStep(1)} 
                            className="text-sm text-orange-500 font-medium hover:underline"
                        >
                            Gửi lại mã?
                        </button>
                    </div>
                 </motion.div>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-base sm:text-sm"
                            placeholder="Mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Check className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-base sm:text-sm"
                            placeholder="Nhập lại mật khẩu"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        {step === 1 && "Gửi mã xác thực"}
                        {step === 2 && "Tiếp tục"}
                        {step === 3 && "Đặt lại mật khẩu"}
                    </>
                )}
              </button>

              <Link
                to="/login"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
};

export default CustomerForgotPasswordScreen;
