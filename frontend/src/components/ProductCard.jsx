import React from "react";

const ProductCard = ({ item }) => {
  return (
    <div className="bg-white rounded-xl shadow p-3 hover:scale-[1.02] transition">
      <img
        src={item.img}
        alt={item.name}
        className="rounded-lg w-full h-32 object-cover"
      />

      <p className="text-black font-medium mt-3">{item.name}</p>

      <button className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg font-bold">
        +
      </button>
    </div>
  );
};

export default ProductCard;
