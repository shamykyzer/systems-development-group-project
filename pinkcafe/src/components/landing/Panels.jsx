import React from 'react';
import { Link } from 'react-router-dom';
import { FaLightbulb, FaChartLine, FaCog, FaSyncAlt, FaDatabase, FaTrashAlt } from 'react-icons/fa';

export function InsightsPanel({ currentForecasts, uploadedData }) {
    return (
        <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
            <div className="bg-pinkcafe2 px-4 py-2.5 flex items-center gap-2">
                <FaLightbulb className="text-white/80 text-xs" />
                <h3 className="font-bold text-white text-sm">Insights</h3>
            </div>
            <div className="bg-white p-4">
            {currentForecasts && currentForecasts.length > 0 ? (
                <ul className="space-y-2 text-xs text-pinkcafe2/80">
                    <li className="flex gap-2"><span className="text-emerald-600">●</span>Forecast generated successfully</li>
                    <li className="flex gap-2"><span className="text-emerald-600">●</span>{currentForecasts.length} product{currentForecasts.length > 1 ? 's' : ''} forecasted</li>
                    {uploadedData && (
                        <>
                            <li className="flex gap-2"><span className="text-blue-600">●</span>Using uploaded data</li>
                            <li className="flex gap-2"><span className="text-amber-600">●</span>Training: {uploadedData.dateRange.start} - {uploadedData.dateRange.end}</li>
                        </>
                    )}
                </ul>
            ) : (
                <div className="text-center py-6">
                    <FaChartLine className="text-pinkcafe2/20 text-3xl mx-auto mb-2" />
                    <p className="text-xs text-pinkcafe2/60">Generate forecast to view insights</p>
                </div>
            )}
            </div>
        </div>
    );
}

export function ModelPanel({ currentForecasts }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-2 flex items-center gap-2">
                <FaCog className="text-xs text-pinkcafe2/50" /> Model
            </h3>
            <p className="text-xs text-pinkcafe2/60">
                {currentForecasts && currentForecasts.length > 0 ? (
                    <>
                        Prophet forecasting<br />• {currentForecasts[0].forecast.length} predictions per product
                    </>
                ) : (
                    <>
                        Prophet forecasting<br />• Awaiting data
                    </>
                )}
            </p>
        </div>
    );
}

export function ForecastControlPanel({ isLoading, hasGenerated, uploadedData, onGenerate }) {
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

export function DatasetPanel({ uploadedData, onDelete }) {
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
