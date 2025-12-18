import { Download, Grid, List } from "lucide-react";

const QRStats = ({ tables, viewMode, setViewMode, onDownloadAll }) => {
  const tablesWithQR = tables.filter((t) => t.hasQR).length;
  const totalTables = tables.length;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img
          src="/images/logo.png"
          alt="Restaurant Logo"
          className="h-16 w-16 object-contain"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản Lý Mã QR</h1>
          <p className="text-gray-600 mt-1">
            Tổng số: {tablesWithQR}/{totalTables} bàn có mã QR
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDownloadAll}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Tải Tất Cả PDF
        </button>

        <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRStats;
