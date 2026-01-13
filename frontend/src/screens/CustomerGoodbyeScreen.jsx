import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Smile, Star, ArrowRight } from 'lucide-react';

const CustomerGoodbyeScreen = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate useEffect to handle navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      navigate('/login', { replace: true });
    }
  }, [countdown, navigate]);

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-300/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: -20,
              scale: Math.random() * 0.5 + 0.5 
            }}
            animate={{ 
              y: window.innerHeight + 20,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: Math.random() * 3 + 5,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative z-10"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="w-24 h-24 object-contain"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            Tạm biệt!
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            >
              <Smile className="w-8 h-8 text-orange-500" />
            </motion.div>
          </h1>
          
          <p className="text-gray-600 text-lg mb-2">
            Cảm ơn bạn đã đến với chúng tôi
          </p>
          <p className="text-gray-500 text-sm">
            Hy vọng bạn đã có trải nghiệm thật tuyệt vời!
          </p>
        </motion.div>

        {/* Heart Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="flex justify-center mb-8"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart className="w-16 h-16 text-red-400 fill-red-400" />
          </motion.div>
        </motion.div>

        {/* Thank you message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 mb-6"
        >
          <p className="text-center text-gray-700 font-medium">
            "Món ăn ngon và dịch vụ tốt là cách chúng tôi nói lời cảm ơn!"
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-gray-500 mb-3">
            Tự động chuyển về trang đăng nhập sau{' '}
            <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
              {countdown}
            </span>
            {' '}giây
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoToLogin}
          className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-400/50 hover:shadow-xl hover:shadow-orange-500/60 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          Quay lại đăng nhập
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-xs text-gray-400 mt-6"
        >
          Hẹn gặp lại bạn lần sau! 🍽️
        </motion.p>
      </motion.div>
    </div>
  );
};

export default CustomerGoodbyeScreen;
