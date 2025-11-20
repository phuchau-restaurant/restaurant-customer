import React from "react";
import ProductCard from "./ProductCard";

const ProductGrid = ({ items }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item, index) => (
        <ProductCard key={index} item={item} />
      ))}
    </div>
  );
};

export default ProductGrid;
