import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TableStatus from "../../constants/tableStatus";

// Components
import TablesHeader from "../components/tables/TablesHeader";
import TablesFilterBar from "../components/tables/TablesFilterBar";
import TableCard from "../components/tables/TableCard";
import TableListView from "../components/tables/TableListView";
import TableFormInline from "../components/tables/TableFormInline";

/**
 * TablesScreen - Màn hình quản lý bàn
 * Hiển thị danh sách bàn với các chức năng:
 * - Lọc theo trạng thái, khu vực
 * - Tìm kiếm theo tên bàn, khu vực
 * - Sắp xếp theo tên bàn, sức chứa
 * - Xem dạng lưới hoặc danh sách
 * - Cập nhật trạng thái bàn (Trống/Có khách)
 */
const TablesScreen = () => {
  const navigate = useNavigate();

  // State quản lý dữ liệu
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // State quản lý UI
  const [viewMode, setViewMode] = useState("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);

  // State quản lý filters
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("tableNumber");

  // Options cho dropdowns
  const statusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: TableStatus.AVAILABLE, label: "Trống" },
    { value: TableStatus.OCCUPIED, label: "Có khách" },
    { value: TableStatus.INACTIVE, label: "Không hoạt động" },
  ];

  const [areaOptions, setAreaOptions] = useState([
    { value: "", label: "Tất cả khu vực" },
  ]);

  // ==================== LIFECYCLE ====================

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    fetchTables();
    fetchLocationOptions();
  }, []);

  // Refetch khi filters thay đổi (server-side filtering)
  useEffect(() => {
    fetchTables();
  }, [statusFilter, areaFilter]);

  // Filter và sort phía client (search và sort)
  useEffect(() => {
    filterAndSortTables();
  }, [tables, searchTerm, sortBy]);

  // ==================== API CALLS ====================

  /**
   * Fetch danh sách bàn từ API
   * Filters: status, location (server-side)
   */
  const fetchTables = async () => {
    try {
      setIsFetching(true);

      // Build query params
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append("status", statusFilter);
      if (areaFilter) queryParams.append("location", areaFilter);

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/tables${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": import.meta.env.VITE_TENANT_ID,
        },
      });

      const result = await response.json();

      if (result.success) {
        setTables(result.data || []);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
      setTables([]);
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  };

  /**
   * Fetch danh sách khu vực từ appsettings API
   */
  const fetchLocationOptions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appsettings?category=Location`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": import.meta.env.VITE_TENANT_ID,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const mappedOptions = [
          { value: "", label: "Tất cả khu vực" },
          ...(result.data || []).map((item) => ({
            value: item.value,
            label: item.value,
          })),
        ];
        setAreaOptions(mappedOptions);
      }
    } catch (error) {
      console.error("Fetch area options error:", error);
    }
  };

  /**
   * Cập nhật trạng thái bàn (Trống <-> Có khách)
   * PATCH /api/admin/tables/:id/status
   */
  const toggleOccupiedStatus = async (tableId, currentStatus) => {
    try {
      const newStatus =
        currentStatus === TableStatus.OCCUPIED
          ? TableStatus.AVAILABLE
          : TableStatus.OCCUPIED;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/tables/${tableId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": import.meta.env.VITE_TENANT_ID,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Cập nhật trạng thái thất bại");
      }

      // Refresh danh sách bàn
      fetchTables();
    } catch (error) {
      console.error("Error updating occupied status:", error);
      alert(error.message || "Có lỗi xảy ra khi cập nhật trạng thái");
    }
  };

  // ==================== HELPERS ====================

  /**
   * Filter và sort tables phía client
   * - Filter: searchTerm (tìm kiếm tên bàn, khu vực)
   * - Sort: tableNumber, capacity
   */
  const filterAndSortTables = () => {
    let result = [...tables];

    // Filter theo search term
    if (searchTerm) {
      result = result.filter(
        (table) =>
          table.tableNumber
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          table.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "tableNumber") {
        return sortByTableNumber(a, b);
      }
      if (sortBy === "capacity") {
        return a.capacity - b.capacity;
      }
      return 0;
    });

    setFilteredTables(result);
  };

  /**
   * Sort bàn theo số bàn (bàn thường trước, VIP sau, sau đó theo số)
   */
  const sortByTableNumber = (a, b) => {
    const parseTableNumber = (value) => {
      const str = String(value ?? "").trim().toLowerCase();
      const isVip = str.includes("vip") ? 1 : 0;
      const match = str.match(/\d+/);
      const number = match ? Number(match[0]) : 0;
      return { isVip, number };
    };

    const A = parseTableNumber(a.tableNumber);
    const B = parseTableNumber(b.tableNumber);

    // Bàn thường trước, VIP sau
    if (A.isVip !== B.isVip) {
      return A.isVip - B.isVip;
    }

    // Cùng loại thì sort theo số
    return A.number - B.number;
  };

  // ==================== HANDLERS ====================

  const handleCreateTable = useCallback(() => {
    setEditingTableId(null);
    setShowForm(true);
  }, []);

  const handleEditTable = useCallback((tableId) => {
    setEditingTableId(tableId);
    setShowForm(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingTableId(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setEditingTableId(null);
    fetchTables(); // Refresh danh sách bàn
  }, [statusFilter, areaFilter]);

  const handleManageQR = useCallback(() => {
    navigate("/tables/qr");
  }, [navigate]);

  // ==================== RENDER ====================

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <TablesHeader
        totalTables={filteredTables.length}
        onCreateTable={handleCreateTable}
        onManageQR={handleManageQR}
      />

      {/* Filter Bar */}
      <TablesFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
        areaFilter={areaFilter}
        onAreaChange={setAreaFilter}
        areaOptions={areaOptions}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Tables Display */}
      <div className="mt-6">
        {showForm ? (
          // Form tạo/sửa bàn
          <TableFormInline
            tableId={editingTableId}
            onCancel={handleCancelForm}
            onSuccess={handleFormSuccess}
          />
        ) : filteredTables.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">Không tìm thấy bàn nào</p>
            <button
              onClick={handleCreateTable}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Thêm bàn mới
            </button>
          </div>
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onEdit={handleEditTable}
                onToggleStatus={toggleOccupiedStatus}
              />
            ))}
          </div>
        ) : (
          // List View
          <TableListView
            tables={filteredTables}
            onEdit={handleEditTable}
            onToggleStatus={toggleOccupiedStatus}
          />
        )}
      </div>
    </div>
  );
};

export default TablesScreen;
