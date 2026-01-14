import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import io from "socket.io-client";

// Services
import { useCustomer } from "../../contexts/CustomerContext";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const PaymentModal = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  onPaymentSuccess,
}) => {
  const { tableInfo } = useCustomer();
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | pending | success | error
  const [socket, setSocket] = useState(null);

  // 1. Khởi tạo Payment & Socket khi mở modal
  useEffect(() => {
    if (!isOpen || !orderId) return;

    // Reset state
    setStatus("loading");
    setQrData(null);

    // A. Setup Socket
    const newSocket = io(API_URL); // Connect tới Backend
    setSocket(newSocket);

    // Listen status update
    newSocket.on(`payment_update_${orderId}`, (data) => {
      console.log("Socket Payment Update:", data);
      if (data.status === "success") {
        setStatus("success");
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
    });

    // B. Call API tạo QR
    const createPayment = async () => {
      try {
        const tenantId =
          localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;
        const res = await fetch(`${API_URL}/api/payment/momo/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();
        if (data.success) {
          setQrData(data.data.qrCodeUrl); // Hoặc data.payUrl để tạo QR local
          setStatus("pending");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Payment Init Error:", error);
        setStatus("error");
      }
    };

    createPayment();

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, orderId]);

  // --- Giả lập thanh toán thành công (Cho Dev Test) ---
  const handleSimulateSuccess = async () => {
    try {
      const tenantId =
        localStorage.getItem("tenantId") || import.meta.env.VITE_TENANT_ID;
      await fetch(`${API_URL}/api/payment/momo/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ orderId }),
      });
      // Socket sẽ tự bắt sự kiện sau đó
    } catch (error) {
      console.error("Simulate Error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#A50064] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">Thanh toán MoMo</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="animate-spin w-10 h-10 text-[#A50064]" />
                <p>Đang tạo mã thanh toán...</p>
              </div>
            )}

            {status === "pending" && qrData && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="bg-white p-2 rounded-xl shadow-inner border border-gray-100">
                  <QRCodeSVG value={qrData} size={200} />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-500">Quét mã để thanh toán</p>
                  <p className="text-2xl font-bold text-[#A50064]">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(totalAmount || 0)}
                  </p>
                </div>

                <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg max-w-xs text-center">
                  Mở app MoMo trên điện thoại và quét mã QR này. Hệ thống sẽ tự
                  động cập nhật khi hoàn tất.
                </div>

                {/* Warning for Localhost */}
                <div className="mt-4 pt-4 border-t w-full">
                  <p className="text-xs text-center text-gray-400 mb-2">
                    Developed Mode: Simulator
                  </p>
                  <button
                    onClick={handleSimulateSuccess}
                    className="w-full py-2 bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-dashed border-gray-300 hover:border-green-400"
                  >
                    [DEV ONLY] Giả lập "Thanh toán thành công"
                  </button>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Thanh toán thành công!
                </h3>
                <p className="text-gray-500 text-center">
                  Cảm ơn bạn đã sử dụng dịch vụ.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3 text-red-500">
                <p>Có lỗi xảy ra khi tạo giao dịch.</p>
                <button onClick={onClose} className="text-sm underline">
                  Đóng và thử lại
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
