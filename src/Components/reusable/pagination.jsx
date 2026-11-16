import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  totalElements = 0,
  pageSize = 20,
  onPageSizeChange,
  pageSizes = [10, 20, 50, 100],
  itemName = 'items'
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startItem = totalElements > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalElements);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-4">
        <span className="text-xs sm:text-sm text-gray-600">
          {totalElements > 0 ? (
            <>
              Showing <span className="font-bold text-purple-700">{startItem}</span> to{' '}
              <span className="font-bold text-purple-700">{endItem}</span> of{' '}
              <span className="font-bold text-purple-700">{totalElements}</span> {itemName}
            </>
          ) : (
            <span className="text-gray-500">No {itemName} found</span>
          )}
        </span>
        {totalElements > 0 && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer hover:border-purple-400 transition"
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-200 text-xs font-semibold shadow-sm"
        >
          Previous
        </button>
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`w-9 h-9 rounded-lg transition-all duration-200 text-xs font-bold shadow-sm ${
              page === currentPage
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-600 shadow-md hover:from-purple-700 hover:to-purple-800 transform hover:scale-105'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-200 text-xs font-semibold shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
