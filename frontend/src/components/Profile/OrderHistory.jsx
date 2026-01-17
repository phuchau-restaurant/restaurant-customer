import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { getOrdersByCustomerId } from "../../services/orderService";
import PaymentModal from "../Payment/PaymentModal";
import AlertModal from "../Modal/AlertModal";
import { useAlert } from "../../hooks/useAlert";
import Spinner from "../Common/Spinner";
import socketService from "../../services/socketService";

const OrderHistory = ({ customer }) => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const { alert, showSuccess, closeAlert } = useAlert();

  // Fetch orders when component mounts or customer changes
  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?.customerId && !customer?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const customerId = customer.customerId || customer.id;
        const data = await getOrdersByCustomerId(customerId);
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [customer]);

  // Handle call waiter for payment
  const handleCallWaiter = (order) => {
    try {
      // Connect socket if not connected
      socketService.connect();

      // Lấy tenantId từ localStorage (đã lưu khi login)
      const tenantId = localStorage.getItem("tenantId");

      // Emit event to call waiter
      socketService.callWaiterForPayment({
        tableId: order.tableId,
        tableNumber: order.tableNumber ||`${order.tableId}`,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        customerName: customer?.name || "Khách hàng",
        displayOrder: order.displayOrder || `#${order.orderId}`,
        tenantId: tenantId, // Lấy từ localStorage
      });

      showSuccess("Đã gọi nhân viên! Vui lòng chờ trong giây lát.");
    } catch (error) {
      console.error("Error calling waiter:", error);
      showSuccess("Đã gọi nhân viên! Vui lòng chờ trong giây lát.");
    }
  };

  const getStatusConfig = (status) => {
    // Map backend status to display config
    const statusLower = status?.toLowerCase() || "";

    const configs = {
      completed: {
        label: "Hoàn thành",
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
      served: {
        label: "Đã phục vụ",
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
      approved: {
        label: "Đã duyệt",
        icon: CheckCircle,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      pending: {
        label: "Đang xử lý",
        icon: Loader,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      unsubmit: {
        label: "Chưa gửi",
        icon: Clock,
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-200",
      },
      cancelled: {
        label: "Đã hủy",
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      },
    };
    return configs[statusLower] || configs.pending;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="large" className="mb-4" />
        <p className="text-gray-500">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        orders.map((order, index) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedOrder === order.orderId;

          return (
            <motion.div
              key={order.orderId}
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
                      <p className="font-semibold text-gray-800">
                        {order.displayOrder || `#${order.orderId}`}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.createdAt)}
                      </div>
                      {order.tableNumber && (
                        <p className="text-xs text-gray-400 mt-1">
                          {order.tableNumber}
                        </p>
                      )}
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
                    <span className="font-bold text-lg">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order.orderId)
                      }
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

                {/* Call Waiter Button - Only show for unpaid orders */}
                {["unsubmit", "approved", "pending", "served"].includes(
                  order.status?.toLowerCase()
                ) && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallWaiter(order);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Gọi NV Thanh Toán
                    </button>
                  </div>
                )}
              </div>

              {/* Order Details */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100 bg-gray-50"
                >
                  <div className="p-4 space-y-3">
                    <h5 className="font-semibold text-gray-800 mb-2">
                      Món đã đặt:
                    </h5>
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-2 border-b border-gray-200 last:border-0"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <p className="font-medium text-gray-700">
                              {item.dishName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Số lượng: {item.quantity}
                            </p>
                            {item.note && (
                              <p className="text-xs text-gray-400 italic mt-1">
                                Ghi chú: {item.note}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                        </div>

                        {/* Display Modifiers */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="ml-4 mt-2 space-y-1">
                            {item.modifiers.map((modifier, modIdx) => (
                              <div
                                key={modIdx}
                                className="flex items-center justify-between text-xs text-gray-600"
                              >
                                <span className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  {modifier.optionName}
                                </span>
                                {modifier.price > 0 && (
                                  <span className="text-orange-600">
                                    +{formatCurrency(modifier.price)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })
      )}
      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedOrderForPayment(null);
        }}
        orderId={selectedOrderForPayment?.orderId}
        totalAmount={selectedOrderForPayment?.totalAmount}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false);
          setSelectedOrderForPayment(null);
          showSuccess("Thanh toán thành công!");
          // Refresh orders list
          const fetchOrders = async () => {
            try {
              const customerId = customer.customerId || customer.id;
              const data = await getOrdersByCustomerId(customerId);
              setOrders(data);
            } catch (err) {
              console.error("Error refreshing orders:", err);
            }
          };
          fetchOrders();
        }}
      />
      {/* Alert Modal */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />{" "}
    </div>
  );
};

export default OrderHistory;
