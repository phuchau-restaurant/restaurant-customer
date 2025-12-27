import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ImageGalleryModal = ({ isOpen, onClose, images, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset về ảnh đầu tiên khi mở modal mới hoặc images thay đổi
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen, images]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  // Khóa scroll khi modal mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Sử dụng Portal để render ra ngoài DOM tree
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[10000] bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:scale-110 shadow-lg"
          >
            <X size={28} />
          </button>

          {/* Image container - Full screen */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-screen h-screen flex items-center justify-center px-20 py-24"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIndex]?.url}
              alt={`Ảnh ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />

            {/* Image counter */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 text-white px-5 py-2.5 rounded-full text-base font-medium backdrop-blur-md shadow-lg">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-4 rounded-full transition-all hover:scale-110 backdrop-blur-md shadow-lg"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-4 rounded-full transition-all hover:scale-110 backdrop-blur-md shadow-lg"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </motion.div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-black/50 p-3 rounded-xl backdrop-blur-md shadow-xl max-w-[90vw] overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={img.id || index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-3 transition-all flex-shrink-0 ${
                    currentIndex === index
                      ? "border-orange-500 scale-110 shadow-lg"
                      : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/40"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ImageGalleryModal;
