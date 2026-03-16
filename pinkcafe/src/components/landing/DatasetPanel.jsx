import React from 'react';
import { Link } from 'react-router-dom';
import { FaDatabase, FaTrashAlt } from 'react-icons/fa';

function DatasetPanel({ uploadedData, onDelete }) {
    if (!uploadedData) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
                <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                    <FaDatabase className="text-xs text-pinkcafe2/50" /> No Data
                </h3>
                <p className="text-xs text-pinkcafe2/60 mb-3">Please upload a CSV file to generate forecasts.</p>
                <Link to="/upload" className="block w-full text-center px-3 py-2 text-xs text-white bg-pinkcafe2 hover:bg-pinkcafe2/90 rounded-lg transition-colors font-semibold">
                    Go to Upload Page
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaDatabase className="text-xs text-pinkcafe2/50" /> Uploaded Dataset
            </h3>
            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-pinkcafe2 font-semibold">
                        {uploadedData.displayName || uploadedData.products[0] || 'Uploaded Data'}
                    </span>
                    <p className="text-xs text-pinkcafe2/60">
                        {uploadedData.dateRange.start} - {uploadedData.dateRange.end}
                    </p>
                </div>
                <button
                    onClick={onDelete}
                    className="w-full px-3 py-2 text-xs text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                >
                    <FaTrashAlt className="text-sm" /> Delete Dataset
                </button>
            </div>
        </div>
    );
}

export default DatasetPanel;
