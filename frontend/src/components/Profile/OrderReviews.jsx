import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, X, Calendar, Edit2, Trash2, AlertTriangle, Plus, ChevronDown } from 'lucide-react';
import {
  getReviewsByCustomer,
  createReview,
  updateReview,
  deleteReview,
  canReviewDish,
} from '../../services/reviewService';
import { getOrdersByCustomerId } from '../../services/orderService';

const OrderReviews = ({ customer }) => {
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviewableDishes, setReviewableDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [newReview, setNewReview] = useState({
    dishId: '',
    orderId: '',
    rating: 0,
    comment: '',
  });
  const [error, setError] = useState(null);

  const customerId = customer?.customerId || customer?.id;

  // Fetch reviews and orders
  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch reviews
        const reviewsData = await getReviewsByCustomer(customerId);
        setReviews(reviewsData);

        // Fetch orders
        const ordersData = await getOrdersByCustomerId(customerId);
        setOrders(ordersData);

        // Extract dishes from completed orders
        const dishes = [];
        const reviewedDishIds = new Set(reviewsData.map(r => r.dishId));

        ordersData.forEach(order => {
          // Allow reviewing dishes from ANY order status
          order.items?.forEach(item => {
            // Only add if not already reviewed
            if (!reviewedDishIds.has(item.dishId)) {
              const existing = dishes.find(d => d.dishId === item.dishId);
              if (!existing) {
                dishes.push({
                  dishId: item.dishId,
                  dishName: item.dishName,
                  orderId: order.orderId,
                });
              }
            }
          });
        });

        setReviewableDishes(dishes);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const StarRating = ({ rating, onRate, readOnly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onRate(star)}
            className={`transition-all ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmitReview = async () => {
    try {
      if (editingReview) {
        // Update existing review
        await updateReview(editingReview.id, customerId, {
          rating: newReview.rating,
          comment: newReview.comment,
        });
        
        // Update local state
        setReviews(reviews.map(r => 
          r.id === editingReview.id 
            ? { ...r, rating: newReview.rating, comment: newReview.comment }
            : r
        ));
      } else {
        // Create new review
        if (!newReview.dishId || !newReview.rating || !newReview.comment) {
          alert('Vui lòng điền đầy đủ thông tin');
          return;
        }

        const result = await createReview({
          customerId,
          dishId: parseInt(newReview.dishId),
          orderId: parseInt(newReview.orderId),
          rating: newReview.rating,
          comment: newReview.comment,
        });

        // Tìm thông tin món ăn để hiển thị ngay lập tức
        const selectedDish = reviewableDishes.find(d => d.dishId === parseInt(newReview.dishId));
        
        const newReviewData = {
          ...result.data,
          dishName: selectedDish?.dishName || 'Món mới', // Fallback name
          createdAt: result.data.createdAt || new Date().toISOString(), // Fix Invalid Date
        };

        // Add to local state
        setReviews([newReviewData, ...reviews]);
        
        // Remove from reviewable dishes
        setReviewableDishes(reviewableDishes.filter(d => d.dishId !== parseInt(newReview.dishId)));
      }

      setNewReview({ dishId: '', orderId: '', rating: 0, comment: '' });
      setIsWritingReview(false);
      setEditingReview(null);
    } catch (err) {
      console.error('Error saving review:', err);
      alert(err.message || 'Có lỗi xảy ra khi lưu đánh giá');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewReview({
      dishId: review.dishId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
    });
    setIsWritingReview(true);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId, customerId);
      
      // Remove from local state
      setReviews(reviews.filter(r => r.id !== reviewId));
      setDeleteConfirm(null);
      
      // Refresh reviewable dishes
      window.location.reload(); // Simple refresh, or re-fetch data
    } catch (err) {
      console.error('Error deleting review:', err);
      alert(err.message || 'Có lỗi xảy ra khi xóa đánh giá');
    }
  };

  const cancelEdit = () => {
    setIsWritingReview(false);
    setEditingReview(null);
    setNewReview({ dishId: '', orderId: '', rating: 0, comment: '' });
  };

  const handleDishSelect = (e) => {
    const dishId = e.target.value;
    const dish = reviewableDishes.find(d => d.dishId === parseInt(dishId));
    setNewReview({
      ...newReview,
      dishId: dishId,
      orderId: dish?.orderId || '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Review Button - Always visible */}
      {!isWritingReview && (
        <button
          onClick={() => setIsWritingReview(true)}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Thêm đánh giá mới
        </button>
      )}

      {/* Write/Edit Review Form */}
      {isWritingReview && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 border-2 border-orange-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              {editingReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá mới'}
            </h4>
            <button
              onClick={cancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Dish Selection - Only for new review */}
            {!editingReview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn món ăn *
                </label>
                <div className="relative">
                  <select
                    value={newReview.dishId}
                    onChange={handleDishSelect}
                    className="w-full px-4 py-3 pr-10 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none appearance-none bg-white"
                  >
                    <option value="">-- Chọn món ăn --</option>
                    {reviewableDishes.map((dish) => (
                      <option key={dish.dishId} value={dish.dishId}>
                        {dish.dishName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {reviewableDishes.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Bạn đã đánh giá tất cả các món hoặc chưa có đơn hàng nào hoàn thành
                  </p>
                )}
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá của bạn *
              </label>
              <StarRating
                rating={newReview.rating}
                onRate={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét *
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows="4"
                className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={
                  !newReview.rating || 
                  !newReview.comment || 
                  (!editingReview && !newReview.dishId)
                }
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-5 h-5" />
                {editingReview ? 'Cập nhật' : 'Gửi đánh giá'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600">Bạn có chắc muốn xóa đánh giá này?</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteReview(deleteConfirm)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Xóa
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có đánh giá nào</p>
            {reviewableDishes.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Nhấn nút "Thêm đánh giá mới" để bắt đầu
              </p>
            )}
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{review.dishName || `Món #${review.dishId}`}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} readOnly />
                </div>
              </div>

              {/* Review Content */}
              <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEditReview(review)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setDeleteConfirm(review.id)}
                  className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderReviews;
