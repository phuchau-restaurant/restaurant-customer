import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.pageSize - Current page size
 * @param {number} props.totalItems - Total number of items
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onPageSizeChange - Callback when page size changes
 * @param {Array} props.pageSizeOptions - Available page size options
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50],
}) => {
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
      
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
      
      if (!shouldShowLeftDots && shouldShowRightDots) {
        // Show first 3 pages + dots + last page
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        // Show first page + dots + last 3 pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        // Show first page + dots + current neighbors + dots + last page
        pages.push(1);
        pages.push('...');
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 px-4 md:px-6 py-3 md:py-4 bg-white border-t border-gray-200">
      {/* Row 1: Items Info + Page Size on Mobile, spreads on Desktop */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Items Info */}
        <div className="text-xs md:text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{startItem}-{endItem}</span>
          <span className="hidden sm:inline"> trong tổng </span>
          <span className="sm:hidden"> / </span>
          <span className="font-semibold text-gray-800">{totalItems}</span>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
            Món/trang:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-2 md:px-3 py-1 md:py-1.5 border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 bg-white hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer transition-all"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Pagination Controls - Centered */}
      <div className="flex items-center justify-center gap-0.5 md:gap-1">
        {/* First Page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={`p-1.5 md:p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
          title="Trang đầu"
        >
          <ChevronsLeft size={16} className="md:hidden" />
          <ChevronsLeft size={18} className="hidden md:block" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1.5 md:p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
          title="Trang trước"
        >
          <ChevronLeft size={16} className="md:hidden" />
          <ChevronLeft size={18} className="hidden md:block" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-0.5 md:gap-1 mx-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 md:px-2 text-gray-400 text-xs md:text-sm"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[28px] md:min-w-[36px] px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1.5 md:p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
          title="Trang sau"
        >
          <ChevronRight size={16} className="md:hidden" />
          <ChevronRight size={18} className="hidden md:block" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-1.5 md:p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
          title="Trang cuối"
        >
          <ChevronsRight size={16} className="md:hidden" />
          <ChevronsRight size={18} className="hidden md:block" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
