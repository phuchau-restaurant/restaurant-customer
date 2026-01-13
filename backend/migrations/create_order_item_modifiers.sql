-- Tạo bảng lưu modifier cho từng món trong đơn hàng
CREATE TABLE IF NOT EXISTS public.order_item_modifiers (
    id SERIAL PRIMARY KEY,
    order_detail_id INTEGER NOT NULL REFERENCES public.order_details(id) ON DELETE CASCADE,
    modifier_option_id INTEGER NOT NULL REFERENCES public.modifier_options(id),
    option_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_detail_id ON public.order_item_modifiers(order_detail_id);

-- Ghi chú: Đảm bảo bảng Tables cũng tồn tại (thường đã có vì logic login dùng nó)
