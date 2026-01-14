import momoService from '../../services/Payment/momoService.js';
import { ordersRepository } from '../../containers/ordersContainer.js'; // Lấy repo truy xuất DB
import { getIO } from '../../configs/socket.js'; // Lấy Socket IO

class PaymentController {
    
    // 1. Tạo link thanh toán
    createPaymentUrl = async (req, res) => {
        try {
            const { orderId } = req.body;
            const tenantId = req.headers['x-tenant-id'];

            if (!orderId) return res.status(400).json({ message: "Order ID is required" });

            // Lấy thông tin đơn hàng để biết số tiền
            const order = await ordersRepository.getById(orderId);
            if (!order) return res.status(404).json({ message: "Order not found" });

            // Tính tổng tiền (Logic đơn giản, thực tế cần tính chi tiết từ items)
            // Giả sử có hàm tính tiền hoặc lấy cột total_amount
            const amount = order.total_amount || 50000; // Mặc định 50k nếu chưa có logic tính
            
            // Cấu hình URL callback (Localhost không chạy được webhook thật)
            const returnUrl = "http://localhost:5173/payment/result";
            const notifyUrl = "http://localhost:3000/api/payment/momo-ipn"; // Webhook

            const paymentResult = await momoService.createPayment(
                orderId.toString(),
                amount,
                returnUrl,
                notifyUrl
            );

            return res.status(200).json({
                success: true,
                data: paymentResult
            });
        } catch (error) {
            console.error("Create Payment Error:", error);
            return res.status(500).json({ message: error.message });
        }
    }

    // 2. Nhận Webhook (IPN) từ MoMo (Hoặc Simulated Call)
    handleMomoIPN = async (req, res) => {
        try {
            console.log("--- RECEIVED WEBHOOK (IPN) ---", req.body);
            
            const { orderId, resultCode, message } = req.body;

            // Kiểm tra chữ ký (Nếu chạy thật)
            // if (!momoService.verifySignature(req.body)) {
                // return res.status(400).json({ message: "Invalid signature" });
            // }

            // resultCode = 0 là thành công
            if (resultCode == 0) {
                // 1. Update Status Order trong DB
                // Status chuyển thành 'Completed' (Đã thanh toán) hoặc 'Pending' nhưng có flag paid
                // Ở đây ta update thành 'Completed'
                await ordersRepository.update(orderId, { status: 'Completed' });
                console.log(`✅ Order ${orderId} updated to Completed`);

                // 2. Gửi Socket tới Frontend
                // Cần tableId để gửi đúng bàn. Ta lấy lại order để biết tableId
                const order = await ordersRepository.getById(orderId);
                const io = getIO();
                if (io && order) {
                    // Phát sự kiện cho room "table_{tableId}" hoặc phát broadcase tùy logic room
                    // Ở dự án này, frontend listen theo logic nào?
                    // Giả sử ta phát global hoặc room cụ thể.
                    // Tốt nhất là phát tới Client đang connect.
                    
                    io.emit(`payment_update_${orderId}`, { 
                        status: 'success', 
                        message: 'Thanh toán thành công qua MoMo!' 
                    });
                    
                    // Nếu có room cho bàn
                    io.to(`table_${order.tableId}`).emit('order_status_update', {
                        status: 'Completed',
                        orderId: orderId
                    });
                }
            }

            return res.status(204).send(); // MoMo yêu cầu trả về 204
        } catch (error) {
            console.error("IPN Error:", error);
            return res.status(500).json({ message: error.message });
        }
    }

    // 3. API Giả lập thanh toán thành công (Cho Dev)
    simulateSuccess = async (req, res) => {
        const { orderId } = req.body;
        // Gọi trực tiếp hàm handleIPN với dữ liệu fake
        const fakeReq = {
            body: {
                orderId: orderId,
                resultCode: 0,
                message: "Giao dịch thành công (Simulated)",
                amount: 50000,
                transId: Date.now()
            }
        };

        await this.handleMomoIPN(fakeReq, res);
    }
}

export default new PaymentController();
