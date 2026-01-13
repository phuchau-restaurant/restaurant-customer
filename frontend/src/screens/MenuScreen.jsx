// src/screens/MenuScreen.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomer } from "../contexts/CustomerContext";
import { motion } from "framer-motion";
import { ShoppingCart, Utensils, LogOut, Search, Filter, ArrowUpDown, X, ChevronDown } from "lucide-react";
import MenuItem from "../components/Menu/MenuItem";
import CartItem from "../components/Cart/CartItem";
import AlertModal from "../components/Modal/AlertModal";
import ImageGalleryModal from "../components/Modal/ImageGalleryModal";
import { useAlert } from "../hooks/useAlert";
import {
  fetchCategories,
  fetchMenus,
  fetchAvatarUrls,
  submitOrder,
} from "../services/menuService";
import Pagination from "../components/Pagination/Pagination";
import AnimatedHamburger from "../components/Menu/AnimatedHamburger";

const MenuScreen = () => {
  const navigate = useNavigate();
  const { customer, tableInfo, logout, updateTable } = useCustomer();
  const { alert, showSuccess, showError, showWarning, closeAlert } = useAlert();

  const [activeCategory, setActiveCategory] = useState("0");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryIdMap, setCategoryIdMap] = useState({});
  const [avatarUrl, setAvatarUrl] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [priceFilter, setPriceFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMenuItems, setTotalMenuItems] = useState(0);

  // Fetch categories and avatar (chỉ 1 lần khi mount)
  useEffect(() => {
    // Kiểm tra đã login và có thông tin bàn chưa
    if (!tableInfo || !tableInfo.id) {
      showWarning("Vui lòng đăng nhập trước!");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    // Load initial data (categories + avatars only)
    const loadInitialData = async () => {
      // Fetch categories
      const { categories: cats, categoryIdMap: idMap } = await fetchCategories();
      setCategories(cats);
      setCategoryIdMap(idMap);

      // Fetch avatar URLs
      const avatars = await fetchAvatarUrls();
      setAvatarUrl(avatars);
      
      // Đánh dấu đã load xong categories
      setIsInitialLoad(false);
    };

    loadInitialData();
  }, []);

  // Fetch menus based on active category (chỉ sau khi đã có categories)
  useEffect(() => {
    // Chờ cho đến khi categories đã load xong
    if (isInitialLoad) return;
    
    const loadMenusByCategory = async () => {
      setIsLoadingMenu(true);
      try {
        // Chỉ thêm categoryId khi KHÔNG phải "0" (Tất cả)
        const categoryId = activeCategory !== "0" ? categoryIdMap[activeCategory] : null;
        
        // Disable pagination when searching/filtering (client-side filtering)
        const hasClientFilter = searchQuery || sortBy !== "default" || priceFilter !== "all";
        
        const result = await fetchMenus({
          categoryId,
          categories,
          activeCategory,
          pageNumber: hasClientFilter ? null : currentPage,
          pageSize: hasClientFilter ? null : pageSize,
        });
        
        // Handle paginated response
        if (result && typeof result === 'object' && 'products' in result) {
          setProducts(result.products);
          setTotalPages(result.totalPages || 1);
          setTotalMenuItems(result.total || 0);
        } else {
          // Backward compatibility: if result is just an array
          setProducts(result);
          setTotalPages(1);
          setTotalMenuItems(result.length);
        }
      } catch (err) {
        console.error("❌ Lỗi fetch menu:", err);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    // Gọi API khi chọn "0" (Tất cả) hoặc khi có categoryId hợp lệ
    if (activeCategory === "0" || categoryIdMap[activeCategory]) {
      loadMenusByCategory();
    }
  }, [activeCategory, categoryIdMap, categories, isInitialLoad, currentPage, pageSize, searchQuery, sortBy, priceFilter]);

  // Filter and Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // 2. Filter by Price
    if (priceFilter !== "all") {
      result = result.filter((p) => {
        if (priceFilter === "under-50") return p.price < 50000;
        if (priceFilter === "50-100") return p.price >= 50000 && p.price <= 100000;
        if (priceFilter === "above-100") return p.price > 100000;
        return true;
      });
    }

    // 3. Sort
    if (sortBy !== "default") {
      result.sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        return 0;
      });
    }

    return result;
  }, [products, searchQuery, sortBy, priceFilter]);

  // Pagination Handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Reset to page 1 when changing category
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  // Submit order handler
  const handleSubmitOrder = async () => {
    try {
      await submitOrder({
        tableId: tableInfo.id,
        customerId: 1,
        dishes: cart,
      });

      showSuccess("Đặt món thành công!");
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error("❌ Lỗi đặt món:", err);
      showError("Đặt món thất bại: " + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    // Small delay to ensure smooth transition
    setTimeout(() => {
      navigate("/goodbye", { replace: true });
    }, 100);
  };

  const randomAvatar = useMemo(() => {
    if (avatarUrl.length === 0) return "/images/avatar/default_avt.svg";
    const index = Math.floor(Math.random() * avatarUrl.length);
    return avatarUrl[index];
  }, [avatarUrl]);

  // Default customer khi chưa login hoặc đã logout
  const defaultCustomer = {
    name: "Khách hàng",
    loyaltyPoints: 0,
  };

  // hiển thị customer từ context hoặc default
  const displayCustomer = customer || defaultCustomer;

  // Cart actions
  const addToCart = (product) => {
    setCart((prev) => {
      // Tạo unique key từ product id + modifiers để phân biệt cùng món nhưng khác modifiers
      const modifiersKey = product.selectedModifiers
        ?.map((m) => m.optionId)
        .sort()
        .join("-") || "";
      const cartItemKey = `${product.id}-${modifiersKey}`;
      
      const existing = prev.find((item) => item.cartItemKey === cartItemKey);
      if (existing) {
        return prev.map((item) =>
          item.cartItemKey === cartItemKey ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          cartItemKey,
          qty: 1,
          note: "",
        },
      ];
    });
  };

  const removeFromCart = (productId, cartItemKey = null) => {
    setCart((prev) =>
      prev
        .map((item) => {
          // Nếu có cartItemKey, dùng nó để xác định item
          if (cartItemKey && item.cartItemKey === cartItemKey) {
            return { ...item, qty: item.qty - 1 };
          }
          // Fallback: dùng productId
          if (!cartItemKey && item.id === productId) {
            return { ...item, qty: item.qty - 1 };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const setQuantity = (product, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.id !== product.id));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.id === product.id ? { ...i, qty: newQty } : i))
      );
    }
  };

  const updateItemNote = (itemId, note, cartItemKey = null) => {
    setCart((prev) =>
      prev.map((item) => {
        if (cartItemKey && item.cartItemKey === cartItemKey) {
          return { ...item, note };
        }
        if (!cartItemKey && item.id === itemId) {
          return { ...item, note };
        }
        return item;
      })
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.totalPrice || item.price) * item.qty,
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <motion.div
      className="flex h-screen bg-linear-to-br from-amber-50 via-orange-50 to-red-50 font-sans overflow-hidden relative select-none"
      initial={{ opacity: 0, scale: 0, rotate: -15, filter: "blur(20px)" }}
      animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, slide in when open */}
      <motion.div
        className={`fixed lg:relative w-30 bg-white border-r flex flex-col items-center py-6 space-y-4 shadow-lg lg:shadow-sm z-40 h-full transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <motion.img
          layoutId="app-logo"
          src="/images/logo.png"
          alt="Logo"
          className="w-20 h-20 object-contain mb-4"
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        {categories.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
            onClick={() => {
              setActiveCategory(cat.id);
              setIsSidebarOpen(false); // Close sidebar on mobile after selecting
            }}
            className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all duration-300 ${
              activeCategory === cat.id
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-300/50 scale-105"
                  : "text-gray-400"

            }`}
          >
            <div className="mb-1">
              {cat.iconUrl ? (
                <img
                  src={cat.iconUrl}
                  alt={cat.name}
                  className="w-8 h-8 object-contain"
                  style={{
                    filter:
                      activeCategory === cat.id
                        ? "brightness(0) invert(1)"
                        : "brightness(0) saturate(100%) invert(75%) sepia(0%) saturate(0%) hue-rotate(180deg)",
                  }}
                />
              ) : (
                <Utensils size={20} />
              )}
            </div>
            <span className="text-[12px] font-bold">{cat.name}</span>
          </motion.button>
        ))}
      </motion.div>

      <div className="flex-1 overflow-y-auto flex flex-col h-screen">
        <motion.header
          className="px-4 md:px-6 py-3 md:py-4 shrink-0 bg-white border-b border-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Left: Hamburger + Table Info */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Animated Hamburger Menu Button - Only on Mobile */}
              <AnimatedHamburger
                isOpen={isSidebarOpen}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
              />
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 inline-flex px-4 md:px-5 py-2 md:py-3 rounded-full shadow-md text-sm md:text-md font-bold text-white">
                Bàn: {tableInfo?.number || "..."}
              </div>
            </div>

            {/* Right: Customer Info */}
            <div className="flex items-center gap-2 md:gap-3 bg-gray-50 rounded-full pl-2 md:pl-3 pr-2 py-2 border border-gray-200 w-full sm:w-auto">
              <div className="relative">
                <img
                  src={randomAvatar}
                  alt="Avatar"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border-2 border-orange-200 shadow-sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-gray-800 truncate">
                  {displayCustomer.name}
                </p>
                <p className="text-[10px] md:text-xs text-amber-600 font-bold">
                  Loyalty: {displayCustomer.loyaltyPoints} điểm
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors px-2 md:px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
              >
                <LogOut size={12} className="md:hidden" />
                <LogOut size={14} className="hidden md:block" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Search, Filter, Sort Toolbar */}
        <motion.div
          className="px-4 md:px-6 py-2 shrink-0 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100 flex flex-col md:flex-row gap-3 items-stretch">
            {/* Search Bar - 50% width */}
            <div className="relative w-full md:flex-1 flex items-center">
              <Search className="absolute left-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm món ăn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Price Filter - 25% width */}
            <div className="relative w-full md:w-60">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="appearance-none w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
              >
                <option value="all">Tất cả giá</option>
                <option value="under-50">Dưới 50k</option>
                <option value="50-100">50k - 100k</option>
                <option value="above-100">Trên 100k</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Sort By - 25% width */}
            <div className="relative w-full md:w-60">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="name-asc">Tên (A-Z)</option>
                <option value="name-desc">Tên (Z-A)</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {isLoadingMenu ? (
            <div className="col-span-full flex flex-col items-center justify-center h-[60vh]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-orange-500 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-gray-500 font-medium">
                Đang tải món ăn...
              </p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
               <div className="bg-gray-100 p-4 rounded-full mb-3">
                 <Search size={32} className="text-gray-400" />
               </div>
               <p className="font-medium">Không tìm thấy món nào</p>
               <button 
                 onClick={() => {
                   setSearchQuery("");
                   setPriceFilter("all");
                   setSortBy("default");
                 }}
                 className="mt-2 text-sm text-orange-500 hover:underline"
               >
                 Xóa bộ lọc
               </button>
            </div>
          ) : (
            filteredAndSortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <MenuItem
                  product={product}
                  onAdd={(productWithModifiers) => addToCart(productWithModifiers)}
                  onImageClick={(product) => setGalleryProduct(product)}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination Component - Only show when not searching/filtering */}
        {!isLoadingMenu && 
         filteredAndSortedProducts.length > 0 && 
         !searchQuery && 
         sortBy === "default" && 
         priceFilter === "all" && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalMenuItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[12, 24, 36, 48]}
          />
        )}
      </div>

      {!isCartOpen && totalItems > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-linear-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-2xl shadow-orange-400/50 hover:shadow-orange-500/60 hover:scale-105 transition-all duration-300 z-40 flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4"
        >
          <div className="relative">
            <ShoppingCart size={24} className="md:hidden" />
            <ShoppingCart size={28} className="hidden md:block" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] md:text-xs opacity-90">Tổng cộng</span>
            <span className="font-bold text-base md:text-lg">
              {totalAmount.toLocaleString("vi-VN")}₫
            </span>
          </div>
        </motion.button>
      )}

      <div
        className={`fixed top-0 right-0 h-screen w-full lg:w-120 bg-white shadow-2xl flex flex-col border-l z-40 transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-amber-500" /> Đơn hàng
          </h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            Đóng
          </button>
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
            cart.map((item) => (
              <CartItem
                key={item.cartItemKey || item.id}
                item={item}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id, item.cartItemKey)}
                onQuantityChange={setQuantity}
                onNoteChange={updateItemNote}
              />
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500">Tổng cộng</span>
            <span className="text-2xl font-bold text-gray-800">
              {totalAmount.toLocaleString("vi-VN")}₫
            </span>
          </div>
          <button
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
              cart.length > 0
                ? "bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white hover:from-orange-600 hover:via-orange-700 hover:to-red-600 hover:shadow-xl hover:shadow-orange-400/50 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={cart.length === 0}
            onClick={handleSubmitOrder}
          >
            Đặt món ngay
          </button>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />

      {/* Image Gallery Modal - Full Screen */}
      {galleryProduct && (
        <ImageGalleryModal
          key={galleryProduct.id}
          isOpen={!!galleryProduct}
          onClose={() => setGalleryProduct(null)}
          images={galleryProduct.photos || []}
          initialIndex={0}
        />
      )}
    </motion.div>
  );
};

export default MenuScreen;
