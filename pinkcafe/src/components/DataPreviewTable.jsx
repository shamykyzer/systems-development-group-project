import React, { useState } from 'react';

export function DataPreviewTable({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 text-center border border-gray-100">
        <svg 
          className="mx-auto h-16 w-16 text-gray-300 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
        <p className="text-sm text-gray-500">Upload and process a CSV file to see a preview of your data</p>
      </div>
    );
  }

  // Get column headers from the first row
  const allColumns = Object.keys(data[0]);
  
  // Ensure Date column appears first
  const dateColumn = allColumns.find(col => col.toLowerCase() === 'date');
  const otherColumns = allColumns.filter(col => col.toLowerCase() !== 'date');
  const columns = dateColumn ? [dateColumn, ...otherColumns] : allColumns;
  
  // Show first 5 rows or all rows if expanded
  const displayData = isExpanded ? data : data.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-200 to-pink-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg 
                className="h-6 w-6 text-gray-800" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              Data Preview
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              Showing <span className="font-bold">{displayData.length}</span> of <span className="font-bold">{data.length}</span> rows
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-lg">
            <span className="text-sm font-bold text-gray-800">{columns.length} COLS</span>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-100 to-pink-100 sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`px-6 py-3 text-left text-xs font-bold text-purple-900 uppercase tracking-wider border-b-2 border-purple-300 ${
                    index === 0 ? 'sticky left-0 bg-purple-100 shadow-sm' : ''
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {displayData.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`transition-all duration-150 hover:bg-purple-50 hover:shadow-sm ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className={`px-6 py-3 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200 ${
                      colIndex === 0 ? 'font-medium text-gray-800 sticky left-0 bg-inherit' : ''
                    }`}
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      {data.length > 5 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 px-6 py-3 border-t border-purple-200 text-center transition-colors duration-200 cursor-pointer"
        >
          <p className="text-xs text-purple-900 font-semibold flex items-center justify-center gap-2">
            + {data.length - 5} more rows not shown
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </p>
        </button>
      )}
    </div>
  );
}

export default DataPreviewTable;