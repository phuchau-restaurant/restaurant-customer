import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Hamburger Menu Icon
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the menu is open
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
const AnimatedHamburger = ({ isOpen = false, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors ${className}`}
      aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
    >
      <div className="w-5 h-4 relative flex flex-col justify-center items-center">
        {/* Top line */}
        <motion.span
          className="absolute w-5 h-0.5 bg-orange-600 rounded-full"
          animate={{
            rotate: isOpen ? 45 : 0,
            y: isOpen ? 0 : -6,
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
        
        {/* Middle line */}
        <motion.span
          className="absolute w-5 h-0.5 bg-orange-600 rounded-full"
          animate={{
            opacity: isOpen ? 0 : 1,
            x: isOpen ? -10 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
        
        {/* Bottom line */}
        <motion.span
          className="absolute w-5 h-0.5 bg-orange-600 rounded-full"
          animate={{
            rotate: isOpen ? -45 : 0,
            y: isOpen ? 0 : 6,
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>
    </button>
  );
};

export default AnimatedHamburger;
