import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import MenuItem from "./MenuItem";
import { fetchRecommendedDishes } from "../../services/menuService";

const RecommendationsSection = ({ 
  currentDishId, 
  onAddToCart, 
  onImageClick, 
  onShowReviews 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentDishId) {
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        const dishes = await fetchRecommendedDishes(currentDishId, 6);
        setRecommendations(dishes);
      } catch (error) {
        console.error("Failed to load recommendations:", error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [currentDishId]);

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null; // Không hiển thị gì nếu không có gợi ý
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-2.5 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Món ăn đề xuất
            </h2>
            <p className="text-sm text-gray-500">
              Các món cùng danh mục được yêu thích
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-sm text-orange-600 font-medium">
          <span>{recommendations.length} món</span>
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Grid of Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {recommendations.map((dish, index) => (
          <motion.div
            key={dish.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <MenuItem
              product={dish}
              onAdd={onAddToCart}
              onImageClick={onImageClick}
              onShowReviews={onShowReviews}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecommendationsSection;
