import React from 'react';

const Table = ({ columns, data, onRowClick, className = '' }) => {
  return (
    <div className={`relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default ${className}`}>
      <table className="w-full text-sm text-left rtl:text-right text-body">
        <thead className="bg-neutral-secondary-soft border-b border-default">
          <tr>
            {columns.map((column, index) => (
              <th key={index} scope="col" className="px-6 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`odd:bg-neutral-primary even:bg-neutral-secondary-soft border-b border-default ${onRowClick ? 'cursor-pointer hover:bg-neutral-tertiary-soft' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
