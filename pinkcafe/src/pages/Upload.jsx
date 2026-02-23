import React, { useState } from 'react';
import NavBar from '../components/NavBar';
import ForecastCsvUploader from '../components/ForecastCsvUploader';



function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setUploadedData(null); // Reset data when new file selected
  };

  const handleProcessFile = () => {
    if (!selectedFile) return;

    // Backend integration will go here


    // ========== DELETE MOCK DATA WHEN BACKEND READY ==========
    // Mock data that simulates backend response
    const mockData = {
      fileName: selectedFile.name,
      dateRange: { start: '01/03/2025', end: '16/10/2025' },
      products: ['Cappuccino', 'Americano'],
      rowCount: 229,
      daysOfData: 229,
      monthsOfData: 7.5,
      stats: {
        Cappuccino: { avg: 75, min: 40, max: 111 },
        Americano: { avg: 92, min: 68, max: 127 }
      },
      preview: [
        { Date: '01/03/2025', Cappuccino: 82, Americano: 100 },
        { Date: '02/03/2025', Cappuccino: 67, Americano: 103 },
        { Date: '03/03/2025', Cappuccino: 75, Americano: 91 },
        { Date: '04/03/2025', Cappuccino: 87, Americano: 92 },
        { Date: '05/03/2025', Cappuccino: 58, Americano: 89 },
        { Date: '06/03/2025', Cappuccino: 85, Americano: 70 },
        { Date: '07/03/2025', Cappuccino: 70, Americano: 71 },
        { Date: '08/03/2025', Cappuccino: 72, Americano: 73 },
        { Date: '09/03/2025', Cappuccino: 69, Americano: 77 },
        { Date: '10/03/2025', Cappuccino: 77, Americano: 82 }
      ],
      validationChecks: {
        validDates: true,
        noMissingValues: true,
        noNegatives: true,
        chronological: true,
        productsDetected: 2
      }
    };
    
    setUploadedData(mockData);
    // ========== END MOCK DATA ==========
  };

  return (
<div className="flex min-h-screen bg-pinkcafe">
    <NavBar />
    <div className="flex-1 md:ml-64 overflow-y-auto">
      <ForecastCsvUploader onFileSelect={handleFileSelect} />
      
      {/* Process button - shown after file selected but before processing */}
      {selectedFile && !uploadedData && (
        <div className="w-full md:w-6/12 mx-auto px-6 pb-6">
          <button
            onClick={handleProcessFile}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Process & Analyze File
          </button>
        </div>
      )}
      
      <div className="w-full md:w-10/12 lg:w-8/12 mx-auto p-6 space-y-6">
        {/* <CSVValidator data={uploadedData} /> */}
        {/* <DataPreviewTable data={uploadedData} /> */}
      </div>
    </div>
</div>
  );
}

export default Upload;