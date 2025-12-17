import { Users, MapPin, QrCode } from "lucide-react";
import TableStatus from "../../../constants/tableStatus";

/**
 * TableListView Component
 * Hiển thị danh sách bàn ở dạng bảng (list view)
 * 
 * @param {array} tables - Danh sách bàn
 * @param {function} onEdit - Callback khi bấm "Sửa"
 * @param {function} onToggleStatus - Callback khi bấm "Trống/Có khách"
 */
const TableListView = ({ tables, onEdit, onToggleStatus }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Số Bàn
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Khu Vực
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sức Chứa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mô Tả
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tình Trạng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              QR Code
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao Tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tables.map((table) => (
            <tr key={table.id} className="hover:bg-gray-50">
              {/* Số bàn */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-lg font-semibold text-gray-800">
                  Bàn {table.tableNumber}
                </span>
              </td>

              {/* Khu vực */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  {table.location || "Chưa xác định"}
                </div>
              </td>

              {/* Sức chứa */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4" />
                  {table.capacity} người
                </div>
              </td>

              {/* Mô tả */}
              <td className="px-6 py-4 max-w-xs">
                <span className="text-sm text-gray-600 line-clamp-2">
                  {table.description || "Không có mô tả"}
                </span>
              </td>

              {/* Tình trạng */}
              <td className="px-6 py-4 whitespace-nowrap">
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
              </td>

              {/* QR Code */}
              <td className="px-6 py-4 whitespace-nowrap">
                {table.qrToken != null ? (
                  <QrCode className="w-5 h-5 text-blue-600" />
                ) : (
                  <span className="text-gray-400 text-sm">Chưa có</span>
                )}
              </td>

              {/* Thao tác */}
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex gap-2 justify-end">
                  {/* Nút sửa */}
                  <button
                    onClick={() => onEdit(table.id)}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Sửa
                  </button>

                  {/* Nút toggle trạng thái */}
                  <button
                    onClick={() => onToggleStatus(table.id, table.status)}
                    className={`px-3 py-1 rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      table.status === TableStatus.OCCUPIED
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                    disabled={table.status === TableStatus.INACTIVE}
                  >
                    {table.status === TableStatus.OCCUPIED ? "Trống" : "Có khách"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableListView;
