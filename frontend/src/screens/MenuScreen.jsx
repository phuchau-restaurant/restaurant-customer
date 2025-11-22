import React from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import TopBar from "../components/TopBar";
import ProductGrid from "../components/ProductGrid";

const categories = [
  "BF. Thịt heo",
  "BF. Salad",
  "BF. Cơm",
  "BF. Món truyền thống",
  "BF. Canh",
  "BF. Lẩu"
];

const items = [
  { name: "Thịt heo đặc biệt sốt Obathan", img: "/images/meat1.jpg" },
  { name: "Sườn heo sốt Obathan", img: "/images/meat2.jpg" },
  { name: "Sườn heo sốt Gabi (XX)", img: "/images/meat3.jpg" },
  { name: "Salad hoa quả XX", img: "/images/salad1.jpg" }
];

const MenuScreen = () => {
  return (
    <div className="w-full h-screen bg-black text-white flex">
      <Sidebar categories={categories} />

      <main className="flex-1 bg-[#f6f2e9] p-5">
        <TopBar />
        <ProductGrid items={items} />
      </main>
    </div>
  );
};

export default MenuScreen;
