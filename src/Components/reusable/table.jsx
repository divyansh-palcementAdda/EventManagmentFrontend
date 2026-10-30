import React from 'react';
import Pagination from './pagination';

const Table = ({ columns, data, onRowClick, className = '', enablePagination = false, currentPage = 1, totalPages = 1, onPageChange, itemsPerPage = 5 }) => {
  const paginatedData = enablePagination
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <tr>
              {columns.map((column, index) => (
                <th key={index} scope="col" className="px-6 py-4 font-semibold text-sm tracking-wide uppercase">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-gray-700">
                    {column.render ? column.render(row[column.accessor], row, rowIndex) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enablePagination && totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mt-4 p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Table;
