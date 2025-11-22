import React from "react";

const CategoryList = ({ categories }) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide scroll-smooth-custom">
      {categories.map((c, i) => (
        <div
          key={i}
          className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/40 cursor-pointer rounded"
        >
          {c}
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
