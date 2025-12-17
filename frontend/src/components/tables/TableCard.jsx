import { MapPin, Users, QrCode } from "lucide-react";
import TableStatus from "../../../constants/tableStatus";

/**
 * TableCard - Component hiển thị thông tin bàn dạng card (grid view)
 * @param {Object} table - Thông tin bàn
 * @param {Function} onEdit - Callback khi click nút chỉnh sửa
 * @param {Function} onToggleStatus - Callback khi chuyển đổi trạng thái Trống/Có khách
 */
const TableCard = ({ table, onEdit, onToggleStatus }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 flex flex-col">
      {/* Table Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800">
          {table.tableNumber}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            table.status === TableStatus.AVAILABLE
              ? "bg-green-100 text-green-700"
              : table.status === TableStatus.OCCUPIED
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {table.status === TableStatus.AVAILABLE && "Trống"}
          {table.status === TableStatus.OCCUPIED && "Có khách"}
          {table.status === TableStatus.INACTIVE && "Không hoạt động"}
        </span>
      </div>

      {/* Location and QR */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{table.location || "Chưa xác định"}</span>
        </div>
        {table.qrToken != null && (
          <QrCode className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-gray-500" />
        <span className="text-gray-700">
          Sức chứa: {table.capacity} người
        </span>
      </div>

      {/* Description */}
      {table.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {table.description}
        </p>
      )}

      {/* Spacer to push actions to bottom */}
      <div className="flex-1"></div>

      {/* Actions */}
      <div className="flex flex-row pt-4 gap-2 border-t border-gray-100 mt-auto">
        <button
          onClick={() => onToggleStatus(table.id, table.status)}
          className={`flex-[2] w-full px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            table.status === TableStatus.OCCUPIED
              ? "bg-green-50 text-green-600 hover:bg-green-100"
              : "bg-red-50 text-red-600 hover:bg-red-100"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={
            table.status === TableStatus.OCCUPIED
              ? "Đánh dấu trống"
              : "Đánh dấu có khách"
          }
          disabled={table.status === TableStatus.INACTIVE}
        >
          {table.status === TableStatus.OCCUPIED ? "Trống" : "Có khách"}
        </button>
        <button
          onClick={() => onEdit(table.id)}
          className="flex-[1] w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          Chỉnh sửa
        </button>
      </div>
    </div>
  );
};

export default TableCard;
