import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Image as ImageIcon, X, Calendar } from 'lucide-react';

const OrderReviews = ({ customer }) => {
  // Mock data - will be replaced with API call
  const [reviews] = useState([
    {
      id: 1,
      orderNumber: 'ORD-2024-001',
      dishName: 'Phở bò đặc biệt',
      rating: 5,
      comment: 'Món ăn rất ngon, phục vụ tận tình!',
      date: '2024-01-13',
      images: [],
    },
    {
      id: 2,
      orderNumber: 'ORD-2023-099',
      dishName: 'Cơm tấm sườn',
      rating: 4,
      comment: 'Ngon, giá cả hợp lý. Sẽ quay lại.',
      date: '2024-01-10',
      images: [],
    },
  ]);

  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    images: [],
  });

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

  const handleSubmitReview = () => {
    // API call will be here
    console.log('Submitting review:', newReview);
    setNewReview({ rating: 0, comment: '', images: [] });
    setIsWritingReview(false);
  };

  return (
    <div className="space-y-4">
      {/* Write Review Button */}
      {!isWritingReview && (
        <button
          onClick={() => setIsWritingReview(true)}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
        >
          <Star className="w-5 h-5" />
          Viết đánh giá mới
        </button>
      )}

      {/* Write Review Form */}
      {isWritingReview && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 border-2 border-orange-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Đánh giá mới</h4>
            <button
              onClick={() => setIsWritingReview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá của bạn
              </label>
              <StarRating
                rating={newReview.rating}
                onRate={(rating) => setNewReview({ ...newReview, rating })}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét
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

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh (tùy chọn)
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-orange-300 rounded-xl hover:bg-orange-50 cursor-pointer transition-colors">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                <span className="text-orange-500 font-medium">Thêm hình ảnh</span>
                <input type="file" accept="image/*" multiple className="hidden" />
              </label>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitReview}
              disabled={!newReview.rating || !newReview.comment}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              Gửi đánh giá
            </button>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có đánh giá nào</p>
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
                <div>
                  <p className="font-semibold text-gray-800">{review.dishName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{review.orderNumber}</span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {review.date}
                    </div>
                  </div>
                </div>
                <StarRating rating={review.rating} readOnly />
              </div>

              {/* Review Content */}
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>

              {/* Review Images */}
              {review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderReviews;
