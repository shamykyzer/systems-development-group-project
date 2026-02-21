import React, { useState } from 'react';

function ForecastCsvUploader({ onFileSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // CSV Validation
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        onFileSelect(file); // Pass file to parent
      } else {
        alert('Please select a CSV file');
        event.target.value = null;
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    onFileSelect(null); // Tell parent file was removed
    // Reset the file input
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) fileInput.value = null;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Upload Forecast CSV</h2>
        
        {/* Hidden file input */}
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-file-input"
        />
        
        {/* File selection area */}
        {!selectedFile ? (
          <div className="border-2 border-dashed border-pinkcafe2 rounded-lg p-8 text-center">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <button
              type="button"
              onClick={() => document.getElementById('csv-file-input').click()}
              className="bg-pinkcafe2 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
            >
              Select CSV File
            </button>
            <p className="text-gray-500 text-sm mt-2">or drag and drop</p>
          </div>
        ) : (
          /* Selected file display */
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg 
                  className="h-10 w-10 text-green-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700 font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForecastCsvUploader;