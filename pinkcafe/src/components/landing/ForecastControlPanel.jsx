import React from 'react';
import { FaSyncAlt } from 'react-icons/fa';

function ForecastControlPanel({ isLoading, hasGenerated, uploadedData, onGenerate }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <button
                onClick={onGenerate}
                disabled={isLoading || !uploadedData}
                className="w-full bg-pinkcafe2 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-pinkcafe2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                <FaSyncAlt className="w-4 h-4 flex-shrink-0" />
                {isLoading ? 'Generating...' : (hasGenerated ? 'Regenerate Forecast' : 'Generate Forecast')}
            </button>
            <p className="text-xs text-pinkcafe2/60 mt-2 text-center">
                {!uploadedData ? 'Upload data first' : (hasGenerated ? 'Update predictions' : 'Generate forecasts for all products')}
            </p>
        </div>
    );
}

export default ForecastControlPanel;
