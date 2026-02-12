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
  const columns = Object.keys(data[0]);
  
  // Show first 5 rows or all rows if expanded
  const displayData = isExpanded ? data : data.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg 
                className="h-5 w-5 text-pink-500" 
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
            <p className="text-sm text-gray-600 mt-1">
              Showing first <span className="font-semibold text-pink-600">{displayData.length}</span> rows
            </p>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
            <span className="text-xs font-medium text-gray-600">{columns.length} columns</span>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className={`overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-64'}`}>
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-pink-200 ${
                    index === 0 ? 'sticky left-0 bg-gray-100 shadow-sm' : ''
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
                className={`transition-all duration-150 hover:bg-pink-50 hover:shadow-sm ${
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
      {data.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-gray-50 hover:bg-gray-100 px-6 py-3 border-t border-gray-200 text-center transition-colors duration-200 cursor-pointer"
        >
          <p className="text-xs text-gray-600 font-medium flex items-center justify-center gap-2">
            {isExpanded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show less
              </>
            ) : (
              <>
                + {data.length - 5} more rows not shown
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </p>
        </button>
      )}
    </div>
  );
}

export default DataPreviewTable;