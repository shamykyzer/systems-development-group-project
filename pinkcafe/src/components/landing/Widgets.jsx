import React from 'react';
import { FaChartLine, FaFolderOpen, FaCheckDouble, FaPoundSign, FaShoppingBag } from 'react-icons/fa';
import { CHART_COLORS } from '../../utils/chartUtils';

// ---------------------------------------------------------------------------
// ChartLegend — coloured dot + product name for each series in the chart
// ---------------------------------------------------------------------------
export function ChartLegend({ data }) {
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-5 pt-4 border-t border-gray-100">
            {data.map((series, idx) => {
                const ci = series.colorIndex ?? idx;
                return (
                    <div key={idx} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[ci % CHART_COLORS.length] }} />
                        <span className="text-xs text-pinkcafe2/80 font-medium tracking-wide">
                            {series.productName}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// LoadingOverlay — full-screen animated overlay shown during forecast generation
// ---------------------------------------------------------------------------
export function LoadingOverlay() {
    return (
        <div className="fixed inset-0 md:left-64 bg-gradient-to-b from-white/80 via-white/70 to-white/80 backdrop-blur-md z-30 flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-6 animate-fade-in-up">
                <svg className="w-full h-full animate-ring-rotate" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#423b3912" strokeWidth="3" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#423b39" strokeWidth="3"
                        strokeLinecap="round" strokeDasharray="140 74" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <FaChartLine className="text-pinkcafe2/70 text-lg" />
                </div>
            </div>
            <div className="flex items-end gap-1 h-8 mb-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="w-1 bg-pinkcafe2/60 rounded-full origin-bottom"
                        style={{
                            animation: `progressPulse 1.2s ease-in-out ${i * 0.12}s infinite`,
                            height: `${14 + Math.sin(i * 0.9) * 10}px`,
                        }} />
                ))}
            </div>
            <p className="text-sm font-semibold text-pinkcafe2 tracking-wide animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                Generating forecast
            </p>
            <p className="text-xs text-pinkcafe2/40 mt-1.5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                Analysing data across all products
            </p>
            <div className="w-48 h-1 rounded-full mt-6 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
                <div className="w-full h-full bg-pinkcafe2/10 rounded-full animate-shimmer" />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// DatasetSelector — dropdown to switch between uploaded datasets (hidden if only one)
// ---------------------------------------------------------------------------
export function DatasetSelector({ allDatasets, selectedDatasetId, onDatasetChange }) {
    if (allDatasets.length <= 1) return null;
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaFolderOpen className="text-xs text-pinkcafe2/50" /> Select Dataset
            </h3>
            <select
                value={selectedDatasetId || ''}
                onChange={(e) => onDatasetChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-pinkcafe2/20 rounded-lg text-sm text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-pinkcafe2/50"
            >
                {allDatasets.map(dataset => (
                    <option key={dataset.datasetId} value={dataset.datasetId}>
                        {dataset.displayName || dataset.fileName}
                    </option>
                ))}
            </select>
            <p className="text-xs text-pinkcafe2/60 mt-2">
                {allDatasets.length} dataset{allDatasets.length > 1 ? 's' : ''} available
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// QuickStatsBar — 3-column row of stat cards; shows placeholders when no data
// ---------------------------------------------------------------------------
const PLACEHOLDER_STATS = [
    { icon: FaCheckDouble, label: 'Training Data' },
    { icon: FaPoundSign, label: 'Products' },
    { icon: FaShoppingBag, label: 'Predictions' }
];

export function QuickStatsBar({ stats }) {
    if (stats.length > 0) {
        return (
            <div className="grid grid-cols-3 gap-4 mb-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    const delayClass = i === 0 ? 'animate-delay-75' : i === 1 ? 'animate-delay-150' : 'animate-delay-225';
                    return (
                        <div key={i} className={`bg-white rounded-xl shadow-sm border border-pinkcafe2/10 px-4 py-4 flex items-center gap-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up ${delayClass}`}>
                            <div className="w-10 h-10 rounded-xl bg-pinkcafe2/10 flex items-center justify-center shrink-0">
                                <Icon className="text-pinkcafe2 text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-pinkcafe2/50 font-semibold uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl font-bold text-pinkcafe2 leading-tight">{stat.value}</p>
                            </div>
                            {stat.change && (
                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                                    stat.positive === true  ? 'bg-emerald-100 text-emerald-700' :
                                    stat.positive === false ? 'bg-rose-100 text-rose-700' :
                                                              'bg-pinkcafe2/8 text-pinkcafe2/60'
                                }`}>
                                    {stat.change}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            {PLACEHOLDER_STATS.map((placeholder, i) => {
                const Icon = placeholder.icon;
                const delayClass = i === 0 ? 'animate-delay-75' : i === 1 ? 'animate-delay-150' : 'animate-delay-225';
                return (
                    <div key={i} className={`bg-white/60 rounded-xl border border-pinkcafe2/8 px-4 py-4 flex items-center gap-3.5 opacity-50 animate-fade-in-up ${delayClass}`}>
                        <div className="w-10 h-10 rounded-xl bg-pinkcafe2/8 flex items-center justify-center shrink-0">
                            <Icon className="text-pinkcafe2/40 text-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-pinkcafe2/40 font-semibold uppercase tracking-wider">{placeholder.label}</p>
                            <p className="text-xl font-bold text-pinkcafe2/30 leading-tight">—</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
