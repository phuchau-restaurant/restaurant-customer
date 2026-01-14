import React from "react";

const CategorySkeleton = () => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="px-4 py-2 rounded-full bg-gray-200 animate-pulse h-10 min-w-[100px]"
        ></div>
      ))}
    </div>
  );
};

export default CategorySkeleton;
