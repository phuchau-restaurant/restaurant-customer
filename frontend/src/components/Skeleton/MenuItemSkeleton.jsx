import React from "react";

const MenuItemSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-200 flex flex-col h-full animate-pulse">
      {/* Image skeleton */}
      <div className="relative w-full h-60 rounded-lg bg-gray-200 mb-2"></div>

      {/* Rating skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-0.5 bg-gray-100 px-2 py-1 rounded-lg h-7 w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>

      {/* Title skeleton */}
      <div className="flex-1 min-w-0 mb-3">
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>

      {/* Recommendations button skeleton */}
      <div className="mt-3 mb-3">
        <div className="h-8 bg-gray-100 rounded-lg w-32"></div>
      </div>

      {/* Price and add button skeleton */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-100">
        <div className="h-8 bg-gray-200 rounded w-24"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
};

export default MenuItemSkeleton;
