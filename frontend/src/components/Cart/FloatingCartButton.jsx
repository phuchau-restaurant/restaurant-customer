import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

const FOOD_ICONS = ['🍔', '🍕', '🍜', '🍗', '🍟', '🥤', '🍱', '🥗'];

const FloatingCartButton = ({ totalItems, totalAmount, onClick }) => {
  const [particles, setParticles] = useState([]);
  const buttonRef = useRef(null);
  const lastEmitTime = useRef(0);
  const particleIdCounter = useRef(0);

  // Motion values cho vị trí của nút
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Hiệu ứng "nghiêng" nút dựa trên vận tốc kéo (tạo cảm giác vật lý)
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleDrag = (event, info) => {
    const now = Date.now();
    // Giới hạn tốc độ sinh icon (mỗi 100ms tối đa 1 icon) để không bị lag
    if (now - lastEmitTime.current > 100) {
      // Chỉ drop icon nếu đang di chuyển đủ nhanh
      const speed = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);
      if (speed > 50) {
        emitParticle(info.point.x, info.point.y);
        lastEmitTime.current = now;
      }
    }
  };

  const emitParticle = (clientX, clientY) => {
    // Lấy vị trí tương đối của nút (một cách tương đối chính xác)
    // Lưu ý: info.point là toạ độ chuột/ngón tay
    
    // Chọn random icon
    const icon = FOOD_ICONS[Math.floor(Math.random() * FOOD_ICONS.length)];
    
    const newParticle = {
      id: particleIdCounter.current++,
      x: clientX,
      y: clientY,
      icon,
      // Random độ bay của icon
      velocityX: (Math.random() - 0.5) * 100,
      velocityY: (Math.random() - 0.5) * 100 + 100, // Luôn rơi xuống một chút
      rotation: Math.random() * 360,
    };

    setParticles(prev => [...prev.slice(-15), newParticle]); // Giữ tối đa 15 particles

    // Tự động xóa particle sau 1s (cleanup)
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  };

  return (
    <>
      {/* Particles Layer - Render bên ngoài nút nhưng cùng cấp z-index thấp hơn */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            opacity: 1, 
            scale: 0.8, 
            x: particle.x - 20, // Offset để căn giữa
            y: particle.y - 20,
            rotate: particle.rotation 
          }}
          animate={{ 
            opacity: 0,
            scale: 0,
            x: particle.x + particle.velocityX,
            y: particle.y + particle.velocityY,
            rotate: particle.rotation + 180
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed pointer-events-none z-30 text-2xl"
          style={{ left: 0, top: 0 }} // Reset position để dùng x,y transform
        >
          {particle.icon}
        </motion.div>
      ))}

      {/* Main Drag Button */}
      <motion.button
        ref={buttonRef}
        drag
        dragMomentum={true} // Cho phép quán tính tự nhiên (vứt nút đi nó trượt tiếp)
        dragElastic={0.1} // Đàn hồi nhẹ khi kéo kịch biên
        // Giới hạn vùng kéo trong cửa sổ (trừ đi kích thước nút)
        dragConstraints={{ 
          left: -window.innerWidth + 80, 
          right: 0, 
          top: -window.innerHeight + 80, 
          bottom: 0 
        }}
        onDrag={handleDrag}
        style={{ x, y, rotateX, rotateY, perspective: 1000 }} // Thêm hiệu ứng 3D nghiêng lắc
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95, cursor: "grabbing" }}
        onClick={onClick}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl shadow-2xl shadow-orange-500/40 z-40 flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 cursor-grab touch-none"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }} // Lắc icon khi hiện
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ShoppingCart size={24} className="md:hidden" />
            <ShoppingCart size={28} className="hidden md:block" />
          </motion.div>
          <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
            {totalItems}
          </span>
        </div>
        
        <div className="flex flex-col items-start min-w-[60px]">
          <span className="text-[10px] md:text-xs opacity-90 font-medium">Tổng cộng</span>
          <span className="font-extrabold text-base md:text-lg">
            {totalAmount.toLocaleString("vi-VN")}₫
          </span>
        </div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: 0.3 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 1 }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
          />
        </div>
      </motion.button>
    </>
  );
};

export default FloatingCartButton;
