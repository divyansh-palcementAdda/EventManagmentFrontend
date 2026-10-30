import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
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

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="text-sm text-gray-600 font-medium">
        Showing page <span className="text-blue-600 font-semibold">{currentPage}</span> of <span className="text-blue-600 font-semibold">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700"
        >
          Previous
        </button>
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
