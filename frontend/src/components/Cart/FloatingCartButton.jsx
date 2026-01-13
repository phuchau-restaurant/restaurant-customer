import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

const FOOD_ICONS = ['🍔', '🍕', '🍜', '🍗', '🍟', '🥤', '🍱', '🥗'];

const FloatingCartButton = ({ totalItems, totalAmount, onClick }) => {
  const [particles, setParticles] = useState([]);
  const buttonRef = useRef(null);
  const lastEmitTime = useRef(0);
  const particleIdCounter = useRef(0);

  // 1. Khởi tạo vị trí từ LocalStorage
  // Dùng function để chỉ đọc localStorage 1 lần khi init
  const initialX = () => {
    try {
      const saved = localStorage.getItem('cartButtonPosition');
      return saved ? JSON.parse(saved).x : 0;
    } catch { return 0; }
  };
  const initialY = () => {
    try {
      const saved = localStorage.getItem('cartButtonPosition');
      return saved ? JSON.parse(saved).y : 0;
    } catch { return 0; }
  };

  const x = useMotionValue(initialX());
  const y = useMotionValue(initialY());

  // Hiệu ứng "nghiêng" nút dựa trên vận tốc kéo
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleDrag = (event, info) => {
    const now = Date.now();
    // 2. Tăng số lượng icon: Giảm delay và speed threshold
    if (now - lastEmitTime.current > 40) { // Mỗi 40ms (25fps)
      const speed = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2);
      if (speed > 10) { // Chỉ cần di chuyển nhẹ
        emitParticle(info.point.x, info.point.y); // Emit 1 icon
        
        // Bonus: Đôi khi emit thêm icon thứ 2 cho dày
        if (Math.random() > 0.5) {
             setTimeout(() => emitParticle(info.point.x + (Math.random()*20-10), info.point.y + (Math.random()*20-10)), 50);
        }
        
        lastEmitTime.current = now;
      }
    }
  };

  const handleDragEnd = () => {
    // 3. Lưu vị trí khi thả tay
    localStorage.setItem('cartButtonPosition', JSON.stringify({ x: x.get(), y: y.get() }));
  };

  const emitParticle = (clientX, clientY) => {
    const icon = FOOD_ICONS[Math.floor(Math.random() * FOOD_ICONS.length)];
    
    const newParticle = {
      id: particleIdCounter.current++,
      x: clientX,
      y: clientY,
      icon,
      velocityX: (Math.random() - 0.5) * 150, // Bay rộng hơn
      velocityY: (Math.random() - 0.5) * 100 + 150, // Rơi nhanh hơn
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.8, // Random kích thước
    };

    setParticles(prev => [...prev.slice(-25), newParticle]); // Tăng giới hạn particles lên 25

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  };

  return (
    <>
      {/* Particles Layer */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            opacity: 1, 
            scale: particle.scale, 
            x: particle.x - 20, 
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
          style={{ left: 0, top: 0 }}
        >
          {particle.icon}
        </motion.div>
      ))}

      {/* Main Drag Button */}
      <motion.button
        ref={buttonRef}
        drag
        dragMomentum={true}
        dragElastic={0.1}
        dragConstraints={{ 
          left: -window.innerWidth + 80, 
          right: 0, 
          top: -window.innerHeight + 80, 
          bottom: 0 
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd} // Lưu vị trí
        style={{ x, y, rotateX, rotateY, cursor: 'grab', touchAction: 'none' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95, cursor: "grabbing" }}
        onClick={onClick}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl shadow-2xl shadow-orange-500/40 z-40 flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4"
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
