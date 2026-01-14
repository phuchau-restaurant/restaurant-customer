import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Plus, X } from "lucide-react";
import { fetchRecommendedDishes } from "../../services/menuService";

const RecommendationsDropdown = ({ dishId, onAddToCart, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  // Load recommendations khi mở dropdown (chỉ load 1 lần)
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadRecommendations();
    }
  }, [isOpen]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const dishes = await fetchRecommendedDishes(dishId, 4); // Chỉ lấy 4 món
      setRecommendations(dishes);
      setHasLoaded(true);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  const handleAddToCart = (dish, e) => {
    e.stopPropagation();
    onAddToCart(dish);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button trigger */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isOpen
            ? "bg-orange-100 text-orange-700 shadow-sm"
            : "bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
        }`}
      >
        <Sparkles size={14} className={isOpen ? "animate-pulse" : ""} />
        <span>Món tương tự</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button only */}
            <div className="flex justify-end px-3 py-2 border-b border-gray-100">
              <button
                onClick={handleToggle}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Không có món tương tự
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recommendations.map((dish) => (
                    <button
                      key={dish.id}
                      onClick={(e) => handleAddToCart(dish, e)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors cursor-pointer text-left"
                    >
                      {/* Image */}
                      <img
                        src={
                          dish.photos?.find((p) => p.isPrimary)?.url ||
                          dish.imgUrl
                        }
                        alt={dish.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm truncate">
                          {dish.name}
                        </h4>
                        <p className="text-orange-600 font-bold text-sm mt-0.5">
                          {dish.price.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer note */}
            {recommendations.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
                {recommendations.length} món được gợi ý
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecommendationsDropdown;
