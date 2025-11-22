import React from "react";
import CategoryList from "./CategoryList";

const Sidebar = ({ categories }) => {
  return (
    <aside className="w-64 bg-black/70 border-r border-gray-700 p-4 flex flex-col">
      <div className="mb-4">
        <img src="/images/logo.png" alt="RoRi" className="w-60" />
        <p className="text-sm opacity-70 mt-1">QUÁN THỊT NƯỚNG HÀN QUỐC</p>
      </div>

      <CategoryList categories={categories} />

      <button className="mt-4 w-full bg-orange-600 py-3 rounded-lg font-medium">
        Thanh toán
      </button>
    </aside>
  );
};

export default Sidebar;
