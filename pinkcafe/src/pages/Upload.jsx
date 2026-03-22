import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import ForecastCsvUploader from '../components/ForecastCsvUploader';
import DataPreviewTable from '../components/DataPreviewTable';
import CSVValidator from '../components/CSVValidator';
import DataStatistics from '../components/DataStatistics';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { authFetch } from '../utils/apiUtils';

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

  // Helper: Merge two header rows if detected (robust for category/product header format)
  const mergeCsvHeaders = async (file) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return file; // Not enough lines to merge

    const firstRow = lines[0].split(',');
    const secondRow = lines[1].split(',');

    // If the second row has any non-empty value after the first column, treat as product header
    const hasProductNames = secondRow.slice(1).some(cell => cell.trim() !== '');
    if (hasProductNames) {
      const merged = [firstRow[0].trim(), ...secondRow.slice(1).map(cell => cell.trim())];
      const newLines = [merged.join(',')].concat(lines.slice(2));
      const newText = newLines.join('\n');
      return new File([newText], file.name, { type: file.type });
    }
    return file;
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Preprocess: merge two header rows if needed
      const processedFile = await mergeCsvHeaders(selectedFile);

      const formData = new FormData();
      formData.append('file', processedFile);

      const response = await authFetch(`${API_BASE_URL}/api/upload/csv`, {
        method: 'POST',
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error(`Failed to parse response: ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process file');
      }

      const formattedData = {
        ...data,
        preview: data.preview.map(row => ({
          ...row,
          Date: new Date(row.Date).toLocaleDateString('en-GB')
        }))
      };

      setUploadedData(formattedData);
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateForecast = async () => {
    if (!uploadedData) return;

    const chosenDisplayName = (displayName || uploadedData.products[0] || 'Sales').trim();

    try {
      const renameResponse = await authFetch(`${API_BASE_URL}/api/upload/dataset/${uploadedData.dataset_id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: chosenDisplayName })
      });

      if (!renameResponse.ok) {
        const renameBody = await renameResponse.json().catch(() => ({}));
        throw new Error(renameBody.message || 'Failed to save dataset name');
      }
    } catch (err) {
      setError(err.message || 'Failed to save dataset name');
      return;
    }
    
    const forecastData = {
      datasetId: uploadedData.dataset_id,
      itemIds: uploadedData.item_ids,
      products: uploadedData.products,
      fileName: uploadedData.fileName,
      dateRange: uploadedData.dateRange,
      displayName: chosenDisplayName,
      uploadedAt: new Date().toISOString()
    };
    
    const existingDatasets = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORECAST_DATA) || '[]');
    const existingIndex = existingDatasets.findIndex(d => d.datasetId === forecastData.datasetId);
    
    if (existingIndex >= 0) {
      existingDatasets[existingIndex] = forecastData;
    } else {
      existingDatasets.push(forecastData);
    }
    
    localStorage.setItem(STORAGE_KEYS.FORECAST_DATA, JSON.stringify(existingDatasets));
    localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, forecastData.datasetId.toString());
    localStorage.setItem(STORAGE_KEYS.AUTO_FORECAST, 'true');
    
    window.location.href = '/home';
  };

  const isDataValid = uploadedData && Object.entries(uploadedData.validationChecks || {}).every(([key, value]) => {
    if (key === 'productsDetected') return value > 0;
    return value === true;
  });

  return (
<div className="flex min-h-screen w-full bg-dashboard-gradient overflow-x-hidden">
    <NavBar />
    <main className="flex-1 min-w-0 md:ml-64 overflow-y-auto min-h-screen flex flex-col pt-20 md:pt-0">
      {/* Centered upload area and cards in the middle of the viewport */}
      <div className="flex-1 flex flex-col items-center justify-center w-full p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="w-full animate-fade-in-up">
            <ForecastCsvUploader onFileSelect={handleFileSelect} />
            
            {error && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-4 animate-fade-in">
                <p className="text-rose-700 font-semibold mb-1">Error</p>
                <p className="text-rose-600 text-sm">{error}</p>
              </div>
            )}

            {selectedFile && !uploadedData && (
              <button
                onClick={handleProcessFile}
                disabled={isProcessing}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin">&#9203;</span>
                    Processing...
                  </>
                ) : (
                  'Process & Analyze File'
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="h-full animate-scale-in animate-delay-150">
            <DataPreviewTable data={uploadedData?.preview} />
          </div>
          <div className="h-full animate-scale-in animate-delay-225">
            <CSVValidator data={uploadedData} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto animate-fade-in-up animate-delay-300">
          <DataStatistics data={uploadedData} />
        </div>

        {isDataValid && (
          <div className="max-w-7xl mx-auto animate-slide-in-right animate-delay-150">
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

        {isDataValid && (
          <div className="max-w-7xl mx-auto animate-fade-in-up animate-delay-225">
            <button
              onClick={handleGenerateForecast}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Forecast
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        </div>
      </div>
    </main>
</div>
  );
}

export default Upload;
