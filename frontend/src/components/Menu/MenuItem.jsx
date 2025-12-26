import React, { useState } from "react";
import { Plus, Minus, Images, Check, Circle } from "lucide-react";
import ImageGalleryModal from "../Modal/ImageGalleryModal";

const MenuItem = ({ product, quantity, onAdd, onRemove, onQuantityChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState({});

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputBlur = () => {
    const newQty = parseInt(inputValue) || 0;
    if (newQty > 0 && newQty !== quantity) {
      onQuantityChange?.(product, newQty);
    }
    setIsEditing(false);
    setInputValue("");
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue("");
    }
  };

  const handleQuantityClick = () => {
    setIsEditing(true);
    setInputValue(quantity.toString());
  };

  // Lấy ảnh chính (isPrimary = true) hoặc ảnh đầu tiên
  const primaryPhoto = product.photos?.find((p) => p.isPrimary) || product.photos?.[0];
  const displayImage = primaryPhoto?.url || product.imgUrl;
  const photoCount = product.photos?.length || 0;
  const extraPhotosCount = photoCount > 1 ? photoCount - 1 : 0;

  // Xử lý chọn modifier
  const handleModifierSelect = (groupId, modifier, selectionType) => {
    setSelectedModifiers((prev) => {
      if (selectionType === "single") {
        return { ...prev, [groupId]: modifier.id };
      } else {
        // Multiple selection
        const currentSelected = prev[groupId] || [];
        if (currentSelected.includes(modifier.id)) {
          return {
            ...prev,
            [groupId]: currentSelected.filter((id) => id !== modifier.id),
          };
        } else {
          return { ...prev, [groupId]: [...currentSelected, modifier.id] };
        }
      }
    });
  };

  const isModifierSelected = (groupId, modifierId, selectionType) => {
    if (selectionType === "single") {
      return selectedModifiers[groupId] === modifierId;
    }
    return (selectedModifiers[groupId] || []).includes(modifierId);
  };


  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 border border-transparent flex flex-col h-full">
      <div 
        className="relative w-full h-60 rounded-[2px] overflow-hidden mb-2 cursor-pointer group"
        onClick={() => photoCount > 0 && setIsGalleryOpen(true)}
      >
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Photo count badge */}
        {extraPhotosCount > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1 backdrop-blur-sm">
            <Images size={14} />
            <span>+{extraPhotosCount}</span>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-w-0 mb-3">
          <h3 className="font-bold text-gray-800 text-2xl mb-1 font-oswald">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-500 text-md line-clamp-2 font-assistant">
              {product.description}
            </p>
          )}
          
          {/* Modifier Groups */}
          {product.modifierGroups && product.modifierGroups.length > 0 && (
            <div className="mt-3 space-y-3">
              {product.modifierGroups.map((group) => (
                <div key={group.id} className="border-t pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {group.name}
                    </span>
                    {group.isRequired && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Bắt buộc
                      </span>
                    )}
                    {group.selectionType === "multiple" && (
                      <span className="text-xs text-gray-400">
                        (Tối đa {group.maxSelect})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.modifiers?.map((modifier) => {
                      const isSelected = isModifierSelected(
                        group.id,
                        modifier.id,
                        group.selectionType
                      );
                      return (
                        <button
                          key={modifier.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModifierSelect(
                              group.id,
                              modifier,
                              group.selectionType
                            );
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                            isSelected
                              ? "bg-orange-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {group.selectionType === "single" ? (
                            <Circle
                              size={14}
                              className={isSelected ? "fill-current" : ""}
                            />
                          ) : (
                            <Check
                              size={14}
                              className={isSelected ? "opacity-100" : "opacity-0"}
                            />
                          )}
                          <span>{modifier.name}</span>
                          {modifier.price > 0 && (
                            <span className="text-xs opacity-75">
                              +{modifier.price.toLocaleString("vi-VN")}đ
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-amber-600 text-[30px] font-smooch-sans font-bold">
            {product.price.toLocaleString("vi-VN")}đ
          </p>
          {quantity > 0 ? (
            <div className="flex items-center border-2 border-orange-500 rounded-full overflow-hidden shadow-lg shrink-0 h-[42px]">
              <div
                onClick={onRemove}
                className="bg-orange-100 text-gray-800 px-2 h-full flex items-center border-r-2 border-orange-600 hover:bg-orange-200 active:bg-orange-300 transition-colors cursor-pointer"
              >
                <Minus size={16} />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  autoFocus
                  className="bg-white text-orange-600 font-bold text-base w-10 text-center outline-none h-full"
                />
              ) : (
                <span
                  onClick={handleQuantityClick}
                  className="bg-white text-orange-600 font-bold text-base min-w-10 text-center cursor-pointer transition-colors h-full flex items-center justify-center"
                >
                  {quantity}
                </span>
              )}
              <div
                onClick={onAdd}
                className="bg-orange-500 text-white px-2 h-full flex items-center border-l-2 border-orange-600 hover:bg-orange-600 active:bg-orange-700 transition-colors cursor-pointer"
              >
                <Plus size={16} />
              </div>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="bg-linear-to-br from-orange-400 to-orange-600 p-2 rounded-full shadow-md shadow-orange-300/40 text-white hover:shadow-lg hover:shadow-orange-400/60 active:scale-95 transition-all duration-300 shrink-0 w-[42px] h-[42px] flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={product.photos || []}
        initialIndex={0}
      />
    </div>
  );
};

export default MenuItem;
