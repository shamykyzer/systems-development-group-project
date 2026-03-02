import React from 'react';

export function CSVValidator({ data }) {
  if (!data) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 text-center border border-gray-100 h-full flex flex-col items-center justify-center">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Validation Results</h3>
        <p className="text-sm text-gray-500">Upload and process a CSV file to see validation checks</p>
      </div>
    );
  }

  const { validationChecks, fileName, rowCount, dateRange, products } = data;
  
  // Calculate overall status
  const allPassed = Object.entries(validationChecks).every(([key, value]) => {
    if (key === 'productsDetected') return value > 0;
    return value === true;
  });

  const validationItems = [
    {
      key: 'validDates',
      label: 'Valid Date Format',
      description: 'All dates are properly formatted',
      icon: (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      )
    },
    {
      key: 'chronological',
      label: 'Chronological Order',
      description: 'Dates are in sequential order',
      icon: (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
        />
      )
    },
    {
      key: 'noMissingValues',
      label: 'No Missing Values',
      description: 'All cells contain data',
      icon: (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
        />
      )
    },
    {
      key: 'noNegatives',
      label: 'No Negative Values',
      description: 'All numeric values are positive',
      icon: (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 4v16m8-8H4" 
        />
      )
    },
    {
      key: 'productsDetected',
      label: 'Products Detected',
      description: `${validationChecks.productsDetected} product column(s) found`,
      icon: (
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
        />
      )
    }
  ];

  const getStatusColor = (key, value) => {
    if (key === 'productsDetected') {
      return value > 0 ? 'text-green-500' : 'text-red-500';
    }
    return value ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (key, value) => {
    const isPassed = key === 'productsDetected' ? value > 0 : value === true;
    
    if (isPassed) {
      return (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${allPassed ? 'bg-gradient-to-r from-teal-200 to-emerald-200 border-teal-300' : 'bg-gradient-to-r from-orange-200 to-amber-200 border-orange-300'}`}>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              CSV Validation
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              {allPassed ? (
                <span className="font-semibold">All checks passed ✓</span>
              ) : (
                <span className="font-semibold">Some checks require attention</span>
              )}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg shadow-sm ${allPassed ? 'bg-white/60 backdrop-blur' : 'bg-white/60 backdrop-blur'}`}>
            <span className="text-sm font-bold text-gray-800">
              {allPassed ? '✓ VALID' : '⚠ WARNING'}
            </span>
          </div>
        </div>
      </div>

      {/* File Info Summary */}
      <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-pinkcafe2/60 text-xs font-medium mb-1">ROWS</p>
            <p className="font-bold text-pinkcafe2 text-lg">{rowCount}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-pinkcafe2/60 text-xs font-medium mb-1">PRODUCTS</p>
            <p className="font-bold text-pinkcafe2 text-lg">{products?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-pinkcafe2/60 text-xs font-medium mb-1">START DATE</p>
            <p className="font-semibold text-pinkcafe2">{dateRange?.start}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <p className="text-pinkcafe2/60 text-xs font-medium mb-1">END DATE</p>
            <p className="font-semibold text-pinkcafe2">{dateRange?.end}</p>
          </div>
        </div>
      </div>

      {/* Validation Checks */}
      <div className="p-6">
        <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">Validation Results</h3>
        <div className="space-y-2">
          {validationItems.map((item) => {
            const isPassed = item.key === 'productsDetected' ? validationChecks[item.key] > 0 : validationChecks[item.key] === true;
            return (
              <div 
                key={item.key}
                className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-200 ${isPassed ? 'bg-teal-100 border border-teal-200' : 'bg-orange-100 border border-orange-200'}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isPassed ? 'bg-teal-300' : 'bg-orange-300'}`}>
                  {isPassed ? (
                    <svg className="w-5 h-5 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-orange-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isPassed ? 'text-teal-900' : 'text-orange-900'}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 ${isPassed ? 'text-teal-700' : 'text-orange-700'}`}>{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      {allPassed && (
        <div className="bg-gradient-to-r from-teal-100 to-emerald-100 px-6 py-4 border-t border-teal-200">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="bg-teal-300 rounded-full p-1">
              <svg className="w-4 h-4 text-teal-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-teal-800 font-bold">Ready for Forecasting</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CSVValidator;
