import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, User, ArrowLeft, Quote } from 'lucide-react';
import { getReviewsByDish } from '../../services/reviewService';

const DishReviewsModal = ({ isOpen, onClose, dish }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && dish?.id) {
      loadReviews();
    }
  }, [isOpen, dish]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getReviewsByDish(dish.id);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = ({ rating, size = "sm" }) => {
    const starSize = size === "lg" ? "w-5 h-5" : "w-3 h-3";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white"
          >
            {/* Header Sticky */}
            <div className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-gray-600 font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Quay lại</span>
              </button>
              <h3 className="font-bold text-gray-800 text-lg truncate max-w-[200px]">
                {dish?.name}
              </h3>
              <div className="w-9" /> {/* Spacer for centering */}
            </div>

            <div className="max-w-3xl mx-auto h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar">
              {/* Dish Info Banner */}
              <div className="relative h-64 sm:h-80 w-full bg-gray-100">
                {dish?.image ? (
                  <>
                    <img 
                      src={dish.image} 
                      alt={dish.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                    <Star className="w-16 h-16" />
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <h2 className="text-3xl sm:text-4xl font-bold font-oswald mb-3 shadow-sm">{dish?.name}</h2>
                  <div className="flex items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                      <span className="text-xl font-bold">{dish?.rating?.averageRating || 0}</span>
                      <span className="text-sm opacity-90 mx-1">/ 5.0</span>
                    </div>
                    <span className="text-lg opacity-90 font-medium">
                      ({dish?.rating?.totalReviews || 0} đánh giá)
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="p-4 sm:p-8 bg-gray-50 min-h-[500px]">
                <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Quote className="w-6 h-6 text-orange-500 rotate-180" />
                  Đánh giá từ khách hàng
                </h4>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500"></div>
                    <p className="text-gray-500">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {reviews.map((review) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={review.id} 
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                              {review.customerAvatar ? (
                                <img 
                                  src={review.customerAvatar} 
                                  alt={review.customerName} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold">
                                  {review.customerName?.charAt(0) || 'K'}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">
                                {review.customerName || `Khách hàng #${review.customerId}`}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(review.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                        
                        <div className="relative pl-4 border-l-2 border-orange-200">
                          <p className="text-gray-700 leading-relaxed italic">
                            "{review.comment}"
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Star className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium text-lg">Chưa có bài đánh giá nào</p>
                    <p className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên trải nghiệm món ăn này!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DishReviewsModal;
