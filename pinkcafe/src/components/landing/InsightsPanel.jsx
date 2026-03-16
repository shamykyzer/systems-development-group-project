import React from 'react';
import { FaLightbulb, FaChartLine } from 'react-icons/fa';

function InsightsPanel({ currentForecasts, uploadedData }) {
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

export default InsightsPanel;
