import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
} from 'lucide-react';

const OrderHistory = ({ customer }) => {
  // Mock data - will be replaced with API call
  const [orders] = useState([
    {
      id: 1,
      orderNumber: 'ORD-2024-001',
      date: '2024-01-13 14:30',
      status: 'completed',
      total: 350000,
      items: [
        { name: 'Phở bò đặc biệt', quantity: 2, price: 150000 },
        { name: 'Trà đá', quantity: 2, price: 10000 },
        { name: 'Gỏi cuốn', quantity: 1, price: 40000 },
      ],
    },
    {
      id: 2,
      orderNumber: 'ORD-2024-002',
      date: '2024-01-12 18:15',
      status: 'cancelled',
      total: 200000,
      items: [
        { name: 'Cơm tấm sườn', quantity: 1, price: 60000 },
        { name: 'Nước chanh', quantity: 1, price: 15000 },
      ],
    },
    {
      id: 3,
      orderNumber: 'ORD-2024-003',
      date: '2024-01-11 12:00',
      status: 'processing',
      total: 450000,
      items: [
        { name: 'Lẩu thái', quantity: 1, price: 380000 },
        { name: 'Nước ngọt', quantity: 2, price: 30000 },
      ],
    },
  ]);

  const [expandedOrder, setExpandedOrder] = useState(null);

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        label: 'Hoàn thành',
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
      },
      processing: {
        label: 'Đang xử lý',
        icon: Loader,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      },
      cancelled: {
        label: 'Đã hủy',
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
      },
    };
    return configs[status] || configs.processing;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        orders.map((order, index) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedOrder === order.id;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
            >
              {/* Order Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        {order.date}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                  </div>
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm"
                  >
                    Chi tiết
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Order Details */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100 bg-gray-50"
                >
                  <div className="p-4 space-y-3">
                    <h5 className="font-semibold text-gray-800 mb-2">Món đã đặt:</h5>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">{item.name}</p>
                          <p className="text-sm text-gray-500">x{item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-800">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default OrderHistory;
