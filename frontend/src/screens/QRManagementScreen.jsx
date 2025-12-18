import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import QRStats from "./QrManagement/QRStats";
import QRGridView from "./QrManagement/QRGridView";
import QRListView from "./QrManagement/QRListView";
import QRDetailModal from "./QrManagement/QRDetailModal";
import RegenerateConfirmModal from "./QrManagement/RegenerateConfirmModal";

const QRManagementScreen = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO: [API INTEGRATION] Kết nối API lấy QR code cho từng bàn
  // Endpoint: GET /api/admin/tables/:id/qr/view
  // Response: { data: { tableId, tableNumber, qrCode (base64), customerLoginUrl, qrTokenCreatedAt, expiresAt } }
  const fetchQRForTable = async (tableId) => {
    // MOCK DATA - Thay thế bằng API call thực tế
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, qrLoading: true } : t))
    );

    // Simulate API delay
    setTimeout(() => {
      const mockQRBase64 =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                qrCodeData: {
                  tableId: tableId,
                  tableNumber: t.tableNumber,
                  qrCode: mockQRBase64,
                  customerLoginUrl: `${
                    import.meta.env.VITE_FRONTEND_URL
                  }/customer/login?token=mock-token-${tableId}`,
                  qrTokenCreatedAt: new Date().toISOString(),
                  expiresAt: new Date(
                    Date.now() + 365 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                },
                qrLoading: false,
              }
            : t
        )
      );
    }, 500);
  };

  // TODO: [API INTEGRATION] Kết nối API lấy danh sách bàn
  // Endpoint: GET /api/admin/tables
  // Headers: x-tenant-id
  // Response: { success: true, data: [{ id, tableNumber, area, qrToken, qrTokenCreatedAt, ... }] }
  const fetchTables = async () => {
    // MOCK DATA - Thay thế bằng API call thực tế
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const mockTables = [
        {
          id: 1,
          tableNumber: "1",
          area: "Khu vực A",
          qrToken: "mock-token-1",
          qrTokenCreatedAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          createdAt: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: 2,
          tableNumber: "2",
          area: "Khu vực A",
          qrToken: "mock-token-2",
          qrTokenCreatedAt: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          createdAt: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: 3,
          tableNumber: "3",
          area: "Khu vực B",
          qrToken: null,
          qrTokenCreatedAt: null,
          createdAt: new Date(
            Date.now() - 20 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: 4,
          tableNumber: "4",
          area: "Khu vực B",
          qrToken: "mock-token-4",
          qrTokenCreatedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          createdAt: new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      const tablesData = mockTables.map((table) => ({
        ...table,
        hasQR: !!table.qrToken,
        qrGeneratedAt: table.qrTokenCreatedAt,
        qrCodeData: null,
        qrLoading: false,
      }));

      setTables(tablesData);
      setIsLoading(false);

      // Fetch QR codes cho các bàn có QR
      tablesData.forEach((table) => {
        if (table.hasQR) {
          fetchQRForTable(table.id);
        }
      });
    }, 800);
  };

  // TODO: [FEATURE] Xem chi tiết QR code trong modal
  const handleViewQR = (table) => {
    setSelectedTable(table);
    // Modal sẽ tự động hiển thị khi selectedTable có giá trị trong QRDetailModal component
  };

  // TODO: [FEATURE] Hiển thị modal xác nhận tạo lại QR
  const handleRegenerateQR = (table) => {
    setSelectedTable(table);
    // Modal sẽ tự động hiển thị khi selectedTable có giá trị trong RegenerateConfirmModal component
  };

  // TODO: [API INTEGRATION] Kết nối API tạo/tạo lại QR code
  // Endpoint: POST /api/admin/tables/:id/qr/generate
  // Headers: Authorization, x-tenant-id
  // Response: { success: true, message: "...", data: { ... } }
  const confirmRegenerateQR = async () => {
    // MOCK DATA - Thay thế bằng API call thực tế
    // Simulate API delay
    setTimeout(() => {
      alert(
        `Đã tạo ${selectedTable.hasQR ? "lại" : ""} mã QR cho Bàn ${
          selectedTable.tableNumber
        } thành công!`
      );
      setSelectedTable(null);
      fetchTables(); // Reload danh sách bàn
    }, 500);
  };

  // TODO: [FEATURE] Download QR code dạng PNG
  // Sử dụng qrCodeData.qrCode (base64) để tải xuống
  const handleDownloadPNG = async (table) => {
    if (!table.qrCodeData?.qrCode) {
      alert("QR code chưa được tải. Vui lòng đợi...");
      return;
    }

    try {
      // Download image directly from base64
      const link = document.createElement("a");
      link.href = table.qrCodeData.qrCode;
      link.download = `QR-Ban-${table.tableNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading QR:", error);
      alert("Có lỗi khi tải mã QR");
    }
  };

  // TODO: [FEATURE] Download QR code dạng PDF
  // Có thể sử dụng thư viện jsPDF hoặc gọi API backend để generate PDF
  const handleDownloadPDF = async (table) => {
    if (!table.qrCodeData?.qrCode) {
      alert("Bàn này chưa có mã QR");
      return;
    }

    alert("Chức năng tải PDF đang được phát triển");
    // TODO: Implement PDF generation with jsPDF or backend API
  };

  // TODO: [FEATURE] Download tất cả QR codes dạng PDF (batch)
  // Có thể tạo 1 file PDF chứa nhiều QR hoặc zip nhiều file PDF
  const handleDownloadAllPDF = () => {
    alert("Chức năng tải tất cả PDF đang được phát triển");
    // TODO: Implement batch PDF generation or ZIP multiple PDFs
  };

  // TODO: [FEATURE] In QR code
  // Mở cửa sổ in với template HTML chứa QR code
  const handlePrint = (table) => {
    if (!table.qrCodeData?.qrCode) {
      alert("QR code chưa được tải. Vui lòng đợi...");
      return;
    }

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>In mã QR - Bàn ${table.tableNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .qr-print {
              text-align: center;
              padding: 40px;
              border: 2px solid #ddd;
            }
            h1 {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .qr-container {
              margin: 30px 0;
            }
            .qr-container img {
              width: 400px;
              height: 400px;
            }
            p {
              font-size: 24px;
              color: #666;
              margin: 10px 0;
            }
            @media print {
              body { margin: 0; }
              .qr-print { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-print">
            <h1>Bàn ${table.tableNumber}</h1>
            <p>${table.area || ""}</p>
            <div class="qr-container">
              <img src="${table.qrCodeData.qrCode}" alt="QR Code" />
            </div>
            <p style="font-size: 28px; margin-top: 30px;">Scan to Order</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/tables")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách bàn
        </button>

        <QRStats
          tables={tables}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onDownloadAll={handleDownloadAllPDF}
        />
      </div>

      {/* QR Codes Display */}
      {viewMode === "grid" ? (
        <QRGridView
          tables={tables}
          onViewQR={handleViewQR}
          onDownloadPNG={handleDownloadPNG}
          onDownloadPDF={handleDownloadPDF}
          onPrint={handlePrint}
          onRegenerateQR={handleRegenerateQR}
        />
      ) : (
        <QRListView
          tables={tables}
          onViewQR={handleViewQR}
          onDownloadPDF={handleDownloadPDF}
          onPrint={handlePrint}
          onRegenerateQR={handleRegenerateQR}
        />
      )}

      {/* QR Detail Modal */}
      <QRDetailModal
        selectedTable={selectedTable}
        onClose={() => setSelectedTable(null)}
        onDownloadPNG={handleDownloadPNG}
        onDownloadPDF={handleDownloadPDF}
        onPrint={handlePrint}
      />

      {/* Regenerate Confirmation Modal */}
      <RegenerateConfirmModal
        selectedTable={selectedTable}
        onConfirm={confirmRegenerateQR}
        onCancel={() => setSelectedTable(null)}
      />
    </div>
  );
};

export default QRManagementScreen;
