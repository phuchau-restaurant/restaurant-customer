import React from "react";

const categories = [
  "BF. Thịt heo",
  "BF. Salad",
  "BF. Cơm",
  "BF. Món truyền thống",
  "BF. Canh",
  "BF. Lẩu"
];

const items = [
  {
    name: "Thịt heo đặc biệt sốt Obathan",
    img: "/images/meat1.jpg"
  },
  {
    name: "Sườn heo sốt Obathan",
    img: "/images/meat2.jpg"
  },
  {
    name: "Sườn heo sốt Gabi (XX)",
    img: "/images/meat3.jpg"
  },
  {
    name: "Salad hoa quả XX",
    img: "/images/salad1.jpg"
  }
];

const MenuScreen = () => {
  return (
    <div className="w-full h-screen bg-black text-white flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black/70 border-r border-gray-700 p-4 flex flex-col">
        <div className="mb-4">
          <img src="/images/logo.png" alt="RoRi" className="w-60" />
          <p className="text-sm opacity-70 mt-1">QUÁN THỊT NƯỚNG HÀN QUỐC</p>
        </div>

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


        <button className="mt-4 w-full bg-orange-600 py-3 rounded-lg font-medium">
          Thanh toán
        </button>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 bg-[#f6f2e9] p-5">
        
        {/* TOP BAR */}
        <div className="flex items-center gap-3 mb-6">
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold">
            📞 Gọi nhân viên
          </button>

          <button className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold">
            💰 Tips cho nhân viên
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow p-3 hover:scale-[1.02] transition"
            >
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
          ))}
        </div>
      </main>
    </div>
  );
};

export default MenuScreen;
