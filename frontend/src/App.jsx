import React, { useState, useMemo } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Utensils, Coffee, Cookie } from 'lucide-react'; // Cần cài: npm install lucide-react

// --- Dữ liệu giả lập (Mock Data) ---
const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: <Utensils size={20} /> },
  { id: 'burger', name: 'Burger', icon: <Utensils size={20} /> },
  { id: 'drink', name: 'Đồ uống', icon: <Coffee size={20} /> },
  { id: 'dessert', name: 'Tráng miệng', icon: <Cookie size={20} /> },
];

const PRODUCTS = [
  { id: 1, name: 'Bò Phô Mai Đặc Biệt', price: 69000, category: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
  { id: 2, name: 'Gà Giòn Cay', price: 55000, category: 'burger', image: 'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=500&q=80' },
  { id: 3, name: 'Trà Đào Cam Sả', price: 45000, category: 'drink', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80' },
  { id: 4, name: 'Cà Phê Sữa Đá', price: 35000, category: 'drink', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80' },
  { id: 5, name: 'Bánh Kem Dâu', price: 40000, category: 'dessert', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&q=80' },
  { id: 6, name: 'Khoai Tây Chiên', price: 25000, category: 'dessert', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&q=80' },
];
const MenuScreen = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);

  // Lọc sản phẩm theo danh mục
  const filteredProducts = useMemo(() => {
    return activeCategory === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  // Thêm vào giỏ hàng
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // Giảm số lượng / Xóa món
  const removeFromCart = (productId) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          return { ...item, qty: item.qty - 1 };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  // Tính tổng tiền
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* --- Cột 1: Danh mục (Sidebar) --- */}
      <div className="w-24 bg-white border-r flex flex-col items-center py-6 space-y-4 shadow-sm z-10">
        {/* Logo */}
        <img 
          src="/images/logo.png" 
          alt="Your Logo" 
          className="w-16 h-16 object-contain mb-4" // Điều chỉnh kích thước logo tại đây
        />
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all ${
              activeCategory === cat.id 
              ? 'bg-amber-500 text-white shadow-lg scale-105' // Màu vàng cam chủ đạo
              : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500' // Màu vàng cam nhạt khi hover
            }`}
          >
            <div className="mb-1">{cat.icon}</div>
            <span className="text-[10px] font-bold">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* --- Cột 2: Khu vực chọn món (Main Grid) --- */}
      <div className="flex-1 overflow-y-auto p-6">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Thực Đơn</h1>
            <p className="text-gray-500">Thứ 5, 20/11/2025</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-amber-600 border border-amber-100"> {/* Màu vàng cam */}
            Bàn số: 05
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 border border-transparent hover:border-amber-200 group" // Màu vàng cam khi hover border
            >
              <div className="h-32 w-full rounded-xl overflow-hidden mb-3 relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md text-amber-500 hover:bg-amber-500 hover:text-white transition-colors"> {/* Màu vàng cam nút + */}
                  <Plus size={16} />
                </button>
              </div>
              <h3 className="font-bold text-gray-800 text-sm truncate">{product.name}</h3>
              <p className="text-amber-600 font-bold mt-1"> {/* Màu vàng cam giá */}
                {product.price.toLocaleString('vi-VN')}đ
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* --- Cột 3: Giỏ hàng (Order Summary) --- */}
      <div className="w-96 bg-white shadow-2xl flex flex-col border-l z-20">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-amber-500" /> Đơn Hàng {/* Màu vàng cam icon */}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <ShoppingCart size={32} />
              </div>
              <p>Chưa có món nào</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{item.name}</h4>
                  <p className="text-xs text-gray-500">{item.price.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 bg-white rounded text-red-500 shadow-sm hover:bg-red-50"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="p-1 bg-white rounded text-green-600 shadow-sm hover:bg-green-50"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500">Tổng cộng</span>
            <span className="text-2xl font-bold text-gray-800">{totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          <button 
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              cart.length > 0 
              ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-200' // Màu vàng cam nút thanh toán
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={cart.length === 0}
            onClick={() => alert(`Đã gửi đơn hàng: ${totalAmount.toLocaleString('vi-VN')}đ`)}
          >
            Thanh Toán Ngay
          </button>
        </div>
      </div>

    </div>
  );
};

export default MenuScreen;