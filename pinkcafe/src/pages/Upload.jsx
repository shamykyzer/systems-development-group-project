import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import ForecastCsvUploader from '../components/ForecastCsvUploader';
import DataPreviewTable from '../components/DataPreviewTable';
import CSVValidator from '../components/CSVValidator';
import DataStatistics from '../components/DataStatistics';



function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [displayName, setDisplayName] = useState('');

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setUploadedData(null);
    setError(null);
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Processing file:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:5001/api/upload/csv', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status, response.statusText);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonErr) {
        console.error('JSON parse error:', jsonErr);
        throw new Error(`Failed to parse response: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process file');
      }

      // Format preview data dates for display
      const formattedData = {
        ...data,
        preview: data.preview.map(row => ({
          ...row,
          Date: new Date(row.Date).toLocaleDateString('en-GB')
        }))
      };

      setUploadedData(formattedData);
    } catch (err) {
      console.error('Upload error details:', err);
      setError(err.message || 'An unknown error occurred');
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateForecast = () => {
    if (!uploadedData) return;
    
    // Store uploaded dataset info for the forecast page
    const forecastData = {
      datasetId: uploadedData.dataset_id,
      itemIds: uploadedData.item_ids,
      products: uploadedData.products,
      fileName: uploadedData.fileName,
      dateRange: uploadedData.dateRange,
      displayName: displayName || uploadedData.products[0] || 'Sales',
      uploadedAt: new Date().toISOString()
    };
    
    // Get existing datasets or create new array
    const existingDatasets = JSON.parse(localStorage.getItem('uploadedForecastData') || '[]');
    
    // Check if this dataset already exists (by dataset_id)
    const existingIndex = existingDatasets.findIndex(d => d.datasetId === forecastData.datasetId);
    
    if (existingIndex >= 0) {
      // Update existing dataset
      existingDatasets[existingIndex] = forecastData;
    } else {
      // Add new dataset
      existingDatasets.push(forecastData);
    }
    
    // Store array of datasets
    localStorage.setItem('uploadedForecastData', JSON.stringify(existingDatasets));
    
    // Set this as the selected dataset
    localStorage.setItem('selectedDatasetId', forecastData.datasetId.toString());
    
    console.log('Stored forecast data:', forecastData);
    console.log('All datasets:', existingDatasets);
    
    // Navigate to home page to see forecast
    window.location.href = '/home';
  };

  // Check if all validations passed
  const isDataValid = uploadedData && Object.entries(uploadedData.validationChecks || {}).every(([key, value]) => {
    if (key === 'productsDetected') return value > 0;
    return value === true;
  });

  return (
<div className="flex min-h-screen bg-pinkcafe">
    <NavBar />
    <div className="flex-1 md:ml-64 overflow-y-auto">
      <ForecastCsvUploader onFileSelect={handleFileSelect} />
      
      {/* Error display */}
      {error && (
        <div className="w-full md:w-6/12 mx-auto px-6 pb-6">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-rose-700 font-semibold mb-1">❌ Error</p>
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Process button - shown after file selected but before processing */}
      {selectedFile && !uploadedData && (
        <div className="w-full md:w-6/12 mx-auto px-6 pb-6">
          <button
            onClick={handleProcessFile}
            disabled={isProcessing}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              'Process & Analyze File'
            )}
          </button>
        </div>
      )}
      
      <div className="w-full p-6 space-y-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto items-start">
          {/* Left column - Data Preview */}
          <div className="h-full">
            <DataPreviewTable data={uploadedData?.preview} />
          </div>
          
          {/* Right column - CSV Validator */}
          <div className="h-full">
            <CSVValidator data={uploadedData} />
          </div>
        </div>

        {/* Data Statistics - Full Width */}
        <div className="max-w-7xl mx-auto">
          <DataStatistics data={uploadedData} />
        </div>

        {/* Display Name Input */}
        {isDataValid && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-pinkcafe2 mb-2">Forecast Display Name</h3>
              <p className="text-sm text-gray-600 mb-4">Give your forecast a friendly name (e.g., "Croissant Sales", "Coffee Sales")</p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={`e.g., ${uploadedData.products[0]} Sales`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pinkcafe2 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Generate Forecast Button */}
        {isDataValid && (
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleGenerateForecast}
              className="w-full bg-pinkcafe2 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
              Generate Forecast
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
</div>
  );
}

export default Upload;