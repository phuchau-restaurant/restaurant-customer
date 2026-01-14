import axios from 'axios';
import crypto from 'crypto';

class MomoService {
  constructor() {
    // Thông tin cấu hình Test (Sandbox) mặc định của MoMo
    this.partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO"; 
    this.accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
    this.secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    this.endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
  }

  /**
   * Tạo Payment Request gửi sang MoMo
   */
  async createPayment(orderId, amount, returnUrl, notifyUrl) {
    const requestId = orderId + "_" + new Date().getTime();
    const orderInfo = "Thanh toan don hang #" + orderId;
    const requestType = "captureWallet";
    const extraData = ""; // Pass empty string if no extra data

    // Tạo chữ ký (Signature) - QUAN TRỌNG NHẤT
    // Format: accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: "Test Restaurant",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      lang: "vi",
      requestType: requestType,
      autoCapture: true,
      extraData: extraData,
      signature: signature,
    };

    try {
        // Gọi MoMo API
        // const response = await axios.post(this.endpoint, requestBody);
        
        // --- SIMULATION MODE (CHẾ ĐỘ GIẢ LẬP) ---
        // Vì localhost không nhận được webhook từ MoMo thật, ta giả lập phản hồi thành công
        // và trả về một link dummy để Frontend hiển thị QR.
        
        console.log("--- MOMO PAYMENT REQUEST (SIMULATION) ---");
        console.log(requestBody);

        return {
            payUrl: `https://test-payment.momo.vn/v2/gateway/pay?t=${Date.now()}`, // Fake URL
            deeplink: `momo://?action=pay&orderId=${orderId}`,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOMO_PAYMENT_${orderId}`, // Dùng tạm API ngoài tạo QR mẫu
            message: "Success",
            resultCode: 0
        };

        // Nếu chạy thật thì uncomment dòng dưới:
        // return response.data;
    } catch (error) {
       console.error("MoMo Create Payment Error:", error.response?.data || error.message);
       throw new Error("Failed to create MoMo payment");
    }
  }

  /**
   * Xác thực Webhook (IPN) từ MoMo gửi về
   */
  verifySignature(body) {
      const {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = body;

      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const mySignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      return mySignature === signature;
  }
}

export default new MomoService();
