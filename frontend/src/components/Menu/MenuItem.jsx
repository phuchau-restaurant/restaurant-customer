import React, { useState } from "react";
import { Plus, Images, Check, ChevronDown, AlertCircle, Star } from "lucide-react";
import RecommendationsDropdown from "./RecommendationsDropdown";


const MenuItem = ({ product, onAdd, onImageClick, onShowReviews }) => {
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [openGroups, setOpenGroups] = useState({});
  const [validationMessage, setValidationMessage] = useState("");
  const [limitWarning, setLimitWarning] = useState(null);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);

  // Lấy ảnh chính (isPrimary = true) hoặc ảnh đầu tiên
  const primaryPhoto = product.photos?.find((p) => p.isPrimary) || product.photos?.[0];
  const displayImage = primaryPhoto?.url || product.imgUrl;
  const photoCount = product.photos?.length || 0;
  const extraPhotosCount = photoCount > 1 ? photoCount - 1 : 0;

  // Xử lý chọn modifier
  const handleModifierSelect = (groupId, optionId, group) => {
    setSelectedModifiers((prev) => {
      const currentSelected = prev[groupId] || [];
      const { minSelections, maxSelections } = group;
      
      // Chỉ áp dụng radio behavior khi maxSelections = 1
      if (maxSelections === 1) {
        // Nếu click vào option đã chọn, giữ nguyên (không toggle off)
        if (currentSelected.includes(optionId)) {
          return prev;
        }
        // Nếu click vào option khác, thay thế
        return { ...prev, [groupId]: [optionId] };
      }
      
      // Multiple selection (checkbox behavior)
      if (currentSelected.includes(optionId)) {
        // Bỏ chọn
        return {
          ...prev,
          [groupId]: currentSelected.filter((id) => id !== optionId),
        };
      } else {
        // Thêm option mới
        
        // Nếu đã đạt max selections, hiện warning và chặn chọn thêm
        if (maxSelections && currentSelected.length >= maxSelections) {
             setLimitWarning(`Bạn chỉ có thể chọn tối đa ${maxSelections} tùy chọn cho "${group.name}"`);
             setTimeout(() => setLimitWarning(null), 3000);
             return prev;
        }
        
        return { ...prev, [groupId]: [...currentSelected, optionId] };
      }
    });
  };

  const isModifierSelected = (groupId, optionId) => {
    const selected = selectedModifiers[groupId] || [];
    return selected.includes(optionId);
  };

  // Toggle mở/đóng dropdown cho từng group
  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Tính tổng giá với modifiers đã chọn
  const calculateTotalPrice = () => {
    let total = product.price;
    
    product.modifierGroups?.forEach((group) => {
      const selectedOptions = selectedModifiers[group.id] || [];
      group.options?.forEach((option) => {
        if (selectedOptions.includes(option.id)) {
          total += option.price;
        }
      });
    });
    
    return total;
  };

  // Lấy danh sách modifiers đã chọn với đầy đủ thông tin
  const getSelectedModifiersData = () => {
    const result = [];
    product.modifierGroups?.forEach((group) => {
      const selectedOptionIds = selectedModifiers[group.id] || [];
      group.options?.forEach((option) => {
        if (selectedOptionIds.includes(option.id)) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            price: option.price,
          });
        }
      });
    });
    return result;
  };

  // Validate modifiers
  const validateModifiers = () => {
    if (!product.modifierGroups || product.modifierGroups.length === 0) {
      return { isValid: true };
    }

    for (const group of product.modifierGroups) {
      if (!group.isActive) continue;
      
      const selectedCount = (selectedModifiers[group.id] || []).length;
      
      // Kiểm tra isRequired - Nếu bắt buộc thì phải chọn ít nhất 1
      if (group.isRequired && selectedCount === 0) {
        return {
          isValid: false,
          message: `Vui lòng chọn ít nhất một tùy chọn cho "${group.name}"`
        };
      }
      
      // Chỉ validate minSelections/maxSelections nếu:
      // 1. Group bắt buộc (isRequired = true), HOẶC
      // 2. User đã bắt đầu chọn (selectedCount > 0)
      const shouldValidateRange = group.isRequired || selectedCount > 0;
      
      if (shouldValidateRange && group.minSelections && selectedCount < group.minSelections) {
        return {
          isValid: false,
          message: `"${group.name}" yêu cầu chọn ít nhất ${group.minSelections} tùy chọn`
        };
      }
      
      // maxSelections luôn validate nếu user đã chọn (không cho vượt quá)
      if (selectedCount > 0 && group.maxSelections && selectedCount > group.maxSelections) {
        return {
          isValid: false,
          message: `"${group.name}" chỉ cho phép chọn tối đa ${group.maxSelections} tùy chọn`
        };
      }
    }
    
    return { isValid: true };
  };

  // Handle add với modifiers
  const handleAddToCart = () => {
    // Validate trước khi thêm
    const validation = validateModifiers();
    if (!validation.isValid) {
      setValidationMessage(validation.message);
      // Auto-hide sau 5 giây
      setTimeout(() => setValidationMessage(""), 5000);
      return;
    }
    
    // Clear validation message nếu valid
    setValidationMessage("");
    
    const modifiersData = getSelectedModifiersData();
    const modifiersPrice = modifiersData.reduce((sum, m) => sum + m.price, 0);
    onAdd({
      ...product,
      selectedModifiers: modifiersData,
      modifiersPrice,
      totalPrice: product.price + modifiersPrice,
    });
  };


  return (
    <div 
      className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 flex flex-col h-full relative ${
        isRecommendationsOpen ? "z-40 ring-2 ring-orange-100" : ""
      } ${
        product.isRecommended 
          ? "border-2 border-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-padding animate-gradient-border" 
          : "border-2 border-gray-200"
      }`}
      style={product.isRecommended ? {
        backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #fb923c, #ec4899, #a855f7, #fb923c)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      } : {}}
    >
      <div 
        className="relative w-full h-60 rounded-[2px] overflow-hidden mb-2 cursor-pointer group"
        onClick={() => {
          // Click để xem ảnh nếu có photos
          if ((product.photos && product.photos.length > 0) || product.imgUrl) {
            onImageClick?.(product);
          }
        }}
      >
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-fill transition-transform duration-500 group-hover:scale-105"
        />
        {/* Photo count badge hoặc icon xem ảnh */}
        {extraPhotosCount > 0 ? (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1 backdrop-blur-sm">
            <Images size={14} />
            <span>+{extraPhotosCount}</span>
          </div>
        ) : photoCount === 1 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white p-1.5 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Images size={16} />
          </div>
        )}

        
        {/* Chef Recommended Badge */}
        {product.isRecommended && (
           <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10 animate-bounce-slow">
             <span>Đề xuất</span>
           </div>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        {/* Rating Section - Vibrant Yellow Design - Clickable */}
        <div 
          className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity w-fit"
          onClick={(e) => {
            e.stopPropagation();
            if (product.rating && product.rating.totalReviews > 0) {
              onShowReviews?.(product);
            }
          }}
        >
          {product.rating && product.rating.totalReviews > 0 ? (
            <>
              <div className="flex items-center gap-0.5 bg-gradient-to-r from-yellow-50 to-orange-50 px-2 py-1 rounded-lg border border-yellow-200">
                {/* Render 5 stars */}
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const rating = parseFloat(product.rating.averageRating);
                  const isFilled = starIndex <= Math.floor(rating);
                  const isHalf = starIndex === Math.ceil(rating) && rating % 1 >= 0.5;
                  
                  return (
                    <Star
                      key={starIndex}
                      className={`w-4 h-4 ${
                        isFilled
                          ? "fill-yellow-500 text-yellow-500"
                          : isHalf
                          ? "fill-yellow-300 text-yellow-500"
                          : "fill-gray-200 text-gray-300"
                      }`}
                    />
                  );
                })}
                <span className="text-xs font-bold text-yellow-700 ml-1">
                  {parseFloat(product.rating.averageRating).toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-blue-600 font-medium underline decoration-dotted hover:text-blue-700 transition-colors">
                ({product.rating.totalReviews} đánh giá)
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                {/* 5 empty stars */}
                {[1, 2, 3, 4, 5].map((starIndex) => (
                  <Star
                    key={starIndex}
                    className="w-4 h-4 fill-gray-200 text-gray-300"
                  />
                ))}
                <span className="text-xs font-bold text-gray-400 ml-1">0.0</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">(Chưa có đánh giá)</span>
            </>
          )}
        </div>
        
        <div className="flex-1 min-w-0 mb-3">
          <h3 className="font-bold text-gray-800 text-2xl mb-1 font-oswald">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-500 text-md line-clamp-2 font-assistant">
              {product.description}
            </p>
          )}
          
          {/* Recommendations Dropdown Button */}
          <div className="mt-3">
            <RecommendationsDropdown 
              dishId={product.id}
              onAddToCart={onAdd}
              onOpenChange={setIsRecommendationsOpen}
            />
          </div>
          
          {/* Warning Message */}
          {limitWarning && (
            <div className="mt-3 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium animate-pulse">
              ⚠️ {limitWarning}
            </div>
          )}
          
          {/* Modifier Groups */}
          {product.modifierGroups && product.modifierGroups.length > 0 && (
            <div className="mt-4 space-y-3">
              {product.modifierGroups.map((group) => {
                if (!group.isActive) return null;
                
                const isSingleChoice = group.minSelections === 1;
                const isOpen = openGroups[group.id];
                const selectedCount = (selectedModifiers[group.id] || []).length;
                const isRequiredNotMet = group.isRequired && selectedCount === 0;
                
                return (
                  <div key={group.id} className={`bg-gray-50 rounded-lg overflow-hidden border-2 transition-colors ${
                    isRequiredNotMet ? 'border-red-300' : 'border-gray-200'
                  }`}>
                    {/* Header - Clickable */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(group.id);
                      }}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          size={18}
                          className={`text-gray-600 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          {group.name}
                        </span>
                        {group.isRequired && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                            Bắt buộc
                          </span>
                        )}
                        {selectedCount > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            {selectedCount} đã chọn
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {group.maxSelections === 1
                          ? "Chọn 1" 
                          : group.minSelections && group.maxSelections
                            ? `Chọn ${group.minSelections}-${group.maxSelections}`
                            : group.minSelections
                              ? `Tối thiểu ${group.minSelections}`
                              : group.maxSelections
                                ? `Tối đa ${group.maxSelections}`
                                : "Chọn nhiều"}
                      </span>
                    </button>
                    
                    {/* Dropdown Content */}
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2">
                        {group.options?.filter(opt => opt.isActive).map((option) => {
                          const isSelected = isModifierSelected(group.id, option.id);
                          
                          return (
                            <button
                              key={option.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModifierSelect(group.id, option.id, group);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                                isSelected
                                  ? "bg-orange-500 text-white shadow-md ring-2 ring-orange-300"
                                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected 
                                    ? "border-white bg-white" 
                                    : "border-gray-300"
                                } ${!isSingleChoice ? "rounded-md" : ""}`}>
                                  {isSelected && (
                                    <Check size={14} className={`${isSelected ? "text-orange-500" : ""}`} />
                                  )}
                                </div>
                                <span className="font-medium">{option.name}</span>
                              </div>
                              {option.price > 0 && (
                                <span className={`text-sm font-semibold ${
                                  isSelected ? "text-white" : "text-orange-600"
                                }`}>
                                  +{option.price.toLocaleString("vi-VN")}đ
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Inline Validation Message */}
        {validationMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-shake">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">
              {validationMessage}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex flex-col">
            <p className="text-amber-600 text-[30px] font-smooch-sans font-bold leading-none">
              {calculateTotalPrice().toLocaleString("vi-VN")}đ
            </p>
            {Object.keys(selectedModifiers).length > 0 && (
              <span className="text-xs text-gray-400 mt-0.5">
                (Đã bao gồm tùy chọn)
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="bg-linear-to-br from-orange-400 to-orange-600 p-2 rounded-full shadow-md shadow-orange-300/40 text-white hover:shadow-lg hover:shadow-orange-400/60 active:scale-95 transition-all duration-300 shrink-0 w-[42px] h-[42px] flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
