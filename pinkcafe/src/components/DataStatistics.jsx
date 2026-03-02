import React from 'react';

export function DataStatistics({ data }) {
  if (!data || !data.stats) {
    return null;
  }

  const { stats, products, daysOfData, monthsOfData } = data;

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-200 to-blue-200 px-6 py-4">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
          Data Statistics
        </h2>
        <p className="text-sm text-gray-700 mt-1">
          Analysis of <span className="font-bold">{daysOfData}</span> days across {monthsOfData} months
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <div 
              key={product}
              className="bg-gradient-to-br from-sky-50 via-white to-blue-50 rounded-xl border-2 border-sky-300 p-5 hover:shadow-xl hover:border-sky-400 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sky-900 text-lg">{product}</h3>
                <div className="bg-sky-300 rounded-full p-2">
                  <svg 
                    className="w-5 h-5 text-sky-800" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" 
                    />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Average */}
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-sky-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                    <span className="text-sm text-sky-900 font-medium">Average</span>
                  </div>
                  <span className="font-bold text-sky-700 text-lg">{stats[product]?.avg}</span>
                </div>

                {/* Minimum */}
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-orange-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                    <span className="text-sm text-orange-900 font-medium">Minimum</span>
                  </div>
                  <span className="font-bold text-orange-700 text-lg">{stats[product]?.min}</span>
                </div>

                {/* Maximum */}
                <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-teal-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-300 rounded-full"></div>
                    <span className="text-sm text-teal-900 font-medium">Maximum</span>
                  </div>
                  <span className="font-bold text-teal-700 text-lg">{stats[product]?.max}</span>
                </div>

                {/* Range */}
                <div className="flex items-center justify-between bg-gradient-to-r from-sky-100 to-blue-100 rounded-lg p-2 border-2 border-sky-300">
                  <span className="text-sm text-sky-900 font-bold">Range</span>
                  <span className="font-bold text-sky-800 text-lg">
                    {stats[product]?.max - stats[product]?.min}
                  </span>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="mt-4">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-300 to-blue-300 rounded-full shadow-lg"
                    style={{ 
                      width: `${(stats[product]?.avg / stats[product]?.max) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-sky-700 font-semibold mt-2 text-center">
                  Avg is {((stats[product]?.avg / stats[product]?.max) * 100).toFixed(0)}% of maximum
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Summary */}
        <div className="mt-6 p-5 bg-gradient-to-r from-sky-100 via-blue-100 to-sky-100 rounded-xl border-2 border-sky-300">
          <div className="flex items-center gap-3">
            <div className="bg-sky-300 rounded-full p-3 flex-shrink-0">
              <svg 
                className="w-6 h-6 text-sky-800" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-sky-900">
                Dataset: <span className="text-sky-700">{daysOfData} days</span> of sales data across <span className="text-sky-700">{products?.length} products</span>
              </p>
              <p className="text-xs text-sky-800 mt-1 font-medium">
                ✓ Sufficient data for accurate forecasting analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataStatistics;
