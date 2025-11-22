import React from "react";

const TopBar = () => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold">
        📞 Gọi nhân viên
      </button>

      <button className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold">
        💰 Tips cho nhân viên
      </button>
    </div>
  );
};

export default TopBar;
