import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPoundSign, FaChartLine, FaShoppingBag, FaCheckDouble, FaHome, FaTrashAlt, FaDatabase, FaSyncAlt, FaLightbulb, FaCog } from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Catmull-Rom spline for smooth curves
// ---------------------------------------------------------------------------
function catmullRomPath(points, tension = 0.3) {
    if (points.length < 2) return '';
    if (points.length === 2) return `M${points[0][0]},${points[0][1]}L${points[1][0]},${points[1][1]}`;
    
    let d = `M${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        
        const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
        const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
        const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
        const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
        
        d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
}

// ---------------------------------------------------------------------------
// Chart color palette
// ---------------------------------------------------------------------------
const CHART_COLORS = [
    '#2d2826', '#dc2646', '#2563eb', '#059669', '#d97706',
    '#7c3aed', '#db2777', '#0891b2', '#65a30d'
];

// ---------------------------------------------------------------------------
// Multi-line chart with smooth curves and gradient fills
// ---------------------------------------------------------------------------
function MultiLineChart({ dataByProduct, dataKey = 'predicted' }) {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);
    const w = 480, h = 260;
    const pad = { top: 16, right: 12, bottom: 44, left: 40 };
    const iw = w - pad.left - pad.right;
    const ih = h - pad.top - pad.bottom;

    const allVals = dataByProduct.flatMap(series => series.data.map(d => d[dataKey] ?? 0));
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const padding = (rawMax - rawMin) * 0.08 || 1;
    const min = rawMin - padding;
    const max = rawMax + padding;
    const range = max - min || 1;

    const px = (i, length) => pad.left + (i / Math.max(length - 1, 1)) * iw;
    const py = (v) => pad.top + ih - ((v - min) / range) * ih;

    const niceStep = (range) => {
        const rough = range / 4;
        const pow = Math.pow(10, Math.floor(Math.log10(rough)));
        const norm = rough / pow;
        if (norm <= 1) return pow;
        if (norm <= 2) return 2 * pow;
        if (norm <= 5) return 5 * pow;
        return 10 * pow;
    };

    const step = niceStep(rawMax - rawMin);
    const tickMin = Math.floor(rawMin / step) * step;
    const tickMax = Math.ceil(rawMax / step) * step;
    const yTicks = [];
    for (let v = tickMin; v <= tickMax; v += step) {
        if (v >= min && v <= max) yTicks.push(v);
    }

    const xLabels = dataByProduct[0]?.data || [];

    const handleMouseMove = (e) => {
        if (!svgRef.current || !xLabels.length) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * w;
        const idx = Math.round(((mouseX - pad.left) / iw) * (xLabels.length - 1));
        if (idx < 0 || idx >= xLabels.length) { setTooltip(null); return; }
        const values = dataByProduct.map((s, si) => ({
            name: s.productName,
            colorIndex: s.colorIndex ?? si,
            value: s.data[idx]?.[dataKey] ?? 0,
        }));
        setTooltip({ idx, x: px(idx, xLabels.length), label: xLabels[idx], values });
    };

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${w} ${h}`}
            style={{ width: '100%', height: '100%' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
        >
            <defs>
                {dataByProduct.map((series, idx) => {
                    const ci = series.colorIndex ?? idx;
                    return (
                        <linearGradient key={idx} id={`lineGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS[ci % CHART_COLORS.length]} stopOpacity="0.12" />
                            <stop offset="100%" stopColor={CHART_COLORS[ci % CHART_COLORS.length]} stopOpacity="0.01" />
                        </linearGradient>
                    );
                })}
            </defs>

            {yTicks.map((v, i) => (
                <g key={i}>
                    <line
                        x1={pad.left} y1={py(v)} x2={pad.left + iw} y2={py(v)}
                        stroke="#e5e0de" strokeWidth="0.5"
                    />
                    <text x={pad.left - 6} y={py(v) + 3.5} textAnchor="end"
                        fontSize="9" fill="#8a807c" fontFamily="system-ui, sans-serif">
                        {Math.round(v)}
                    </text>
                </g>
            ))}

            {dataByProduct.map((series, seriesIdx) => {
                const vals = series.data.map(d => d[dataKey] ?? 0);
                const pts = vals.map((v, i) => [px(i, series.data.length), py(v)]);
                const linePath = catmullRomPath(pts);
                const ci = series.colorIndex ?? seriesIdx;
                const color = CHART_COLORS[ci % CHART_COLORS.length];
                const lastPt = pts[pts.length - 1];
                const firstPt = pts[0];
                const areaPath = linePath + `L${lastPt[0]},${pad.top + ih}L${firstPt[0]},${pad.top + ih}Z`;

                return (
                    <g key={seriesIdx}>
                        <path d={areaPath} fill={`url(#lineGrad-${seriesIdx})`} />
                        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" />
                        {vals.map((v, i) => (
                            <circle key={i} cx={px(i, series.data.length)} cy={py(v)}
                                r={tooltip?.idx === i ? 4.5 : 3} fill={color}
                                stroke="white" strokeWidth="1.5"
                                style={{ transition: 'r 0.15s ease' }} />
                        ))}
                    </g>
                );
            })}

            {xLabels.map((d, i) => (
                <g key={`x-${i}`}>
                    <text x={px(i, xLabels.length)} y={h - 18} textAnchor="middle"
                        fontSize="9.5" fill="#423b39" fontWeight="500" fontFamily="system-ui, sans-serif">
                        {d.day}
                    </text>
                    <text x={px(i, xLabels.length)} y={h - 6} textAnchor="middle"
                        fontSize="7.5" fill="#8a807c" fontFamily="system-ui, sans-serif">
                        {d.date}
                    </text>
                </g>
            ))}

            {tooltip && (
                <>
                    <line x1={tooltip.x} y1={pad.top} x2={tooltip.x} y2={pad.top + ih}
                        stroke="#423b3930" strokeWidth="1" strokeDasharray="3 3" />
                    <g transform={`translate(${Math.min(tooltip.x + 8, w - 110)}, ${pad.top + 4})`}>
                        <rect x="0" y="0" width="100" height={20 + tooltip.values.length * 16}
                            rx="6" fill="white" stroke="#e5e0de" strokeWidth="0.5"
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
                        <text x="8" y="14" fontSize="9" fill="#423b39" fontWeight="600"
                            fontFamily="system-ui, sans-serif">
                            {tooltip.label?.day} {tooltip.label?.date}
                        </text>
                        {tooltip.values.map((tv, ti) => (
                            <g key={ti} transform={`translate(8, ${24 + ti * 16})`}>
                                <circle cx="4" cy="-3" r="3"
                                    fill={CHART_COLORS[tv.colorIndex % CHART_COLORS.length]} />
                                <text x="12" y="0" fontSize="8.5" fill="#6b6360"
                                    fontFamily="system-ui, sans-serif">
                                    {tv.name}: <tspan fontWeight="600" fill="#423b39">{Math.round(tv.value * 10) / 10}</tspan>
                                </text>
                            </g>
                        ))}
                    </g>
                </>
            )}
        </svg>
    );
}

// ===========================================================================
// Pure helper functions (no component state dependency)
// ===========================================================================

function filterForecastFromToday(forecastData) {
    if (!forecastData || !forecastData.forecast) return forecastData;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredForecast = forecastData.forecast.filter(f => {
        const forecastDate = new Date(f.date);
        forecastDate.setHours(0, 0, 0, 0);
        return forecastDate >= today;
    });
    return { ...forecastData, forecast: filteredForecast };
}

function transformProphetData(forecast, range) {
    if (!forecast || !forecast.length) return [];

    let pointsToShow = forecast.length;
    let groupBy = 1;

    if (range === 'upcomingYear') groupBy = 30;
    else if (range === 'upcomingMonth') groupBy = 7;
    else if (range === '7days') pointsToShow = Math.min(7, forecast.length);

    const grouped = [];

    if (range === '7days') {
        for (let i = 0; i < Math.min(7, forecast.length); i++) {
            const dataPoint = forecast[i];
            const date = new Date(dataPoint.date);
            grouped.push({
                day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                predicted: Math.round(dataPoint.yhat * 10) / 10
            });
        }
    } else if (range === 'upcomingMonth') {
        const daysToShow = Math.min(4 * 7, forecast.length);
        for (let i = 0; i < daysToShow; i += groupBy) {
            const slice = forecast.slice(i, i + groupBy);
            if (slice.length === 0) break;
            const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
            const date = new Date(slice[0].date);
            grouped.push({
                day: `Week ${Math.floor(i / 7) + 1}`,
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                predicted: Math.round(avgYhat * 10) / 10
            });
        }
    } else if (range === 'upcomingYear') {
        const monthlyData = {};
        forecast.forEach(f => {
            const date = new Date(f.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { values: [], firstDate: date };
            monthlyData[monthKey].values.push(f.yhat);
        });
        Object.keys(monthlyData).sort().forEach(monthKey => {
            const data = monthlyData[monthKey];
            const avgYhat = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
            grouped.push({
                day: data.firstDate.toLocaleDateString('en-GB', { month: 'short' }),
                date: data.firstDate.toLocaleDateString('en-GB', { year: 'numeric' }),
                predicted: Math.round(avgYhat * 10) / 10
            });
        });
    } else if (range === 'custom') {
        const totalDays = forecast.length;
        if (totalDays > 60) {
            const monthlyData = {};
            forecast.forEach(f => {
                const date = new Date(f.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                if (!monthlyData[monthKey]) monthlyData[monthKey] = { values: [], firstDate: date };
                monthlyData[monthKey].values.push(f.yhat);
            });
            Object.keys(monthlyData).sort().forEach(monthKey => {
                const data = monthlyData[monthKey];
                const avgYhat = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
                grouped.push({
                    day: data.firstDate.toLocaleDateString('en-GB', { month: 'short' }),
                    date: data.firstDate.toLocaleDateString('en-GB', { year: 'numeric' }),
                    predicted: Math.round(avgYhat * 10) / 10
                });
            });
            return grouped;
        }
        if (totalDays > 14) groupBy = 7;
        for (let i = 0; i < pointsToShow; i += groupBy) {
            const slice = forecast.slice(i, i + groupBy);
            const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
            const date = new Date(slice[0].date);
            if (groupBy === 7) {
                grouped.push({
                    day: `Week ${Math.floor(i / 7) + 1}`,
                    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    predicted: Math.round(avgYhat * 10) / 10
                });
            } else {
                grouped.push({
                    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
                    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    predicted: Math.round(avgYhat * 10) / 10
                });
            }
        }
    }

    return grouped;
}

function calcForecastTrend(forecasts) {
    if (!forecasts || forecasts.length === 0) return null;
    const allPoints = forecasts.flatMap(f => f.forecast || []);
    if (allPoints.length < 2) return null;
    const mid = Math.floor(allPoints.length / 2);
    const avgFirst = allPoints.slice(0, mid).reduce((s, p) => s + p.yhat, 0) / mid;
    const avgSecond = allPoints.slice(mid).reduce((s, p) => s + p.yhat, 0) / (allPoints.length - mid);
    if (avgFirst === 0) return null;
    return ((avgSecond - avgFirst) / avgFirst) * 100;
}

function getTrainingDays(dateRange) {
    if (!dateRange) return 'N/A';
    const [startDay, startMonth, startYear] = dateRange.start.split('/');
    const [endDay, endMonth, endYear] = dateRange.end.split('/');
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    return Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
}

function getMaxForecastMonths(dateRangeEnd) {
    if (!dateRangeEnd) return 7;
    const lastDataDate = new Date(dateRangeEnd.split('/').reverse().join('-'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxForecastDate = new Date(lastDataDate);
    maxForecastDate.setDate(maxForecastDate.getDate() + (52 * 7));
    const monthsAvailable = Math.round((maxForecastDate - today) / (30.44 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(12, monthsAvailable));
}

// ===========================================================================
// Sub-components
// ===========================================================================

function LoadingOverlay() {
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

const PLACEHOLDER_STATS = [
    { icon: FaCheckDouble, label: 'Training Data' },
    { icon: FaPoundSign, label: 'Products' },
    { icon: FaShoppingBag, label: 'Predictions' }
];

function QuickStatsBar({ stats }) {
    if (stats.length > 0) {
        return (
            <div className="grid grid-cols-3 gap-3 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-lg shadow-sm border border-pinkcafe2/8 px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                            <div className="w-8 h-8 rounded-lg bg-pinkcafe2/8 flex items-center justify-center shrink-0">
                                <Icon className="text-pinkcafe2/60 text-xs" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-pinkcafe2/50 font-medium uppercase tracking-wider">{stat.label}</p>
                                <p className="text-lg font-bold text-pinkcafe2 leading-tight">{stat.value}</p>
                            </div>
                            {stat.change && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
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
        <div className="grid grid-cols-3 gap-3 mb-8">
            {PLACEHOLDER_STATS.map((placeholder, i) => {
                const Icon = placeholder.icon;
                return (
                    <div key={i} className="bg-white/60 rounded-lg border border-pinkcafe2/8 px-4 py-3 flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 rounded-lg bg-pinkcafe2/8 flex items-center justify-center shrink-0">
                            <Icon className="text-pinkcafe2/40 text-xs" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-pinkcafe2/40 font-medium uppercase tracking-wider">{placeholder.label}</p>
                            <p className="text-lg font-bold text-pinkcafe2/30 leading-tight">—</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ChartLegend({ data }) {
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-5 pt-4 border-t border-gray-100">
            {data.map((series, idx) => {
                const ci = series.colorIndex ?? idx;
                return (
                    <div key={idx} className="flex items-center gap-2">
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

function InsightsPanel({ currentForecasts, uploadedData }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaLightbulb className="text-xs text-pinkcafe2/50" /> Insights
            </h3>
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
    );
}

function ModelPanel({ currentForecasts }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-2 flex items-center gap-2">
                <FaCog className="text-xs text-pinkcafe2/50" /> Model
            </h3>
            <p className="text-xs text-pinkcafe2/60">
                {currentForecasts && currentForecasts.length > 0
                    ? `Prophet forecasting • ${currentForecasts[0].forecast.length} predictions per product`
                    : 'Prophet forecasting • Awaiting data'
                }
            </p>
        </div>
    );
}

function ForecastControlPanel({ isLoading, hasGenerated, uploadedData, onGenerate }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaSyncAlt className="text-xs text-pinkcafe2/50" /> Forecast Control
            </h3>
            <button
                onClick={onGenerate}
                disabled={isLoading || !uploadedData}
                className="w-full bg-pinkcafe2 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-pinkcafe2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
                {isLoading ? 'Generating...' : (hasGenerated ? 'Regenerate Forecast' : 'Generate Forecast')}
            </button>
            <p className="text-xs text-pinkcafe2/60 mt-2 text-center">
                {!uploadedData ? 'Upload data first' : (hasGenerated ? 'Update predictions' : 'Generate forecasts for all products')}
            </p>
        </div>
    );
}

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

function DatasetSelector({ allDatasets, selectedDatasetId, onDatasetChange }) {
    if (allDatasets.length <= 1) return null;
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaDatabase className="text-xs text-pinkcafe2/50" /> Select Dataset
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

// ===========================================================================
// Main component
// ===========================================================================

function LandingPagePanel() {
    const autoGenerateTriggered = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [forecastRange, setForecastRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('all');

    const [forecast7Days, setForecast7Days] = useState([]);
    const [forecastMonth, setForecastMonth] = useState([]);
    const [forecastYear, setForecastYear] = useState([]);
    const [forecastCustom, setForecastCustom] = useState([]);
    const [forecastError, setForecastError] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);

    const [allDatasets, setAllDatasets] = useState([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState(null);
    const [uploadedData, setUploadedData] = useState(null);

    const maxForecastMonths = getMaxForecastMonths(uploadedData?.dateRange?.end);

    const FORECAST_RANGE_OPTIONS = [
        { value: '7days', label: 'Next 7 days' },
        { value: 'upcomingMonth', label: 'Next 4 weeks' },
        { value: 'upcomingYear', label: `Long-term (${maxForecastMonths} month${maxForecastMonths !== 1 ? 's' : ''})` },
        { value: 'custom', label: 'Custom dates' },
    ];

    // ── Load stored datasets on mount ──────────────────────────────────────
    useEffect(() => {
        const storedData = localStorage.getItem('uploadedForecastData');
        if (!storedData) return;
        try {
            const data = JSON.parse(storedData);
            if (Array.isArray(data)) {
                setAllDatasets(data);
                const selectedId = localStorage.getItem('selectedDatasetId');
                if (selectedId) {
                    const dataset = data.find(d => d.datasetId.toString() === selectedId);
                    if (dataset) { setSelectedDatasetId(parseInt(selectedId)); setUploadedData(dataset); }
                    else if (data.length > 0) { setSelectedDatasetId(data[0].datasetId); setUploadedData(data[0]); localStorage.setItem('selectedDatasetId', data[0].datasetId.toString()); }
                } else if (data.length > 0) {
                    setSelectedDatasetId(data[0].datasetId); setUploadedData(data[0]); localStorage.setItem('selectedDatasetId', data[0].datasetId.toString());
                }
            } else {
                const dataArray = [data];
                setAllDatasets(dataArray); setSelectedDatasetId(data.datasetId); setUploadedData(data);
                localStorage.setItem('uploadedForecastData', JSON.stringify(dataArray));
                localStorage.setItem('selectedDatasetId', data.datasetId.toString());
            }
        } catch (err) { console.error('Failed to parse uploaded data:', err); }
    }, []);

    // ── Dataset switching ──────────────────────────────────────────────────
    const handleDatasetChange = (datasetId) => {
        const dataset = allDatasets.find(d => d.datasetId === datasetId);
        if (!dataset) return;
        setSelectedDatasetId(datasetId);
        setUploadedData(dataset);
        localStorage.setItem('selectedDatasetId', datasetId.toString());
        setForecast7Days([]); setForecastMonth([]); setForecastYear([]); setForecastCustom([]);
        setHasGenerated(false);
    };

    // ── Generate all forecasts ─────────────────────────────────────────────
    const generateAllForecasts = async () => {
        if (!uploadedData) { setForecastError('Please upload data first'); return; }

        setIsLoading(true);
        setForecastError(null);
        setForecast7Days([]); setForecastMonth([]); setForecastYear([]);

        try {
            const datasetId = uploadedData.datasetId;
            const lastDataDate = new Date(uploadedData.dateRange.end.split('/').reverse().join('-'));
            const today = new Date();
            const weeksFromLastData = Math.ceil((today - lastDataDate) / (7 * 24 * 60 * 60 * 1000));

            const horizon7Days = Math.min(52, weeksFromLastData + 1);
            const horizonMonth = Math.min(52, weeksFromLastData + 4);
            const targetEndDate = new Date(today);
            targetEndDate.setDate(targetEndDate.getDate() + Math.ceil(maxForecastMonths * 30.44));
            const horizonYear = Math.min(52, Math.max(1, Math.ceil((targetEndDate - lastDataDate) / (7 * 24 * 60 * 60 * 1000))));

            const forecasts7Days = [], forecastsMonth = [], forecastsYear = [];

            for (const productName of uploadedData.products) {
                const itemId = uploadedData.itemIds[productName];
                const displayName = uploadedData.displayName || productName;
                try {
                    const [res7, resM, resY] = await Promise.all([
                        fetch(`http://localhost:5001/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon7Days}&train_weeks=20&_t=${Date.now()}`),
                        fetch(`http://localhost:5001/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizonMonth}&train_weeks=20&_t=${Date.now()}`),
                        fetch(`http://localhost:5001/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizonYear}&train_weeks=20&_t=${Date.now()}`),
                    ]);
                    const [data7, dataM, dataY] = await Promise.all([res7.json(), resM.json(), resY.json()]);
                    if (res7.ok) forecasts7Days.push({ ...filterForecastFromToday(data7), item_name: displayName, product_name: productName });
                    if (resM.ok) forecastsMonth.push({ ...filterForecastFromToday(dataM), item_name: displayName, product_name: productName });
                    if (resY.ok) forecastsYear.push({ ...filterForecastFromToday(dataY), item_name: displayName, product_name: productName });
                } catch (error) { console.error(`Error fetching forecast for ${productName}:`, error); }
            }

            setForecast7Days(forecasts7Days); setForecastMonth(forecastsMonth); setForecastYear(forecastsYear);
            setHasGenerated(true); setLastGenerated(new Date());
        } catch (error) {
            console.error('Forecast error:', error);
            setForecastError(error.message);
            setForecast7Days([]); setForecastMonth([]); setForecastYear([]); setHasGenerated(false);
        } finally { setIsLoading(false); }
    };

    // ── Auto-generate when arriving from upload page ───────────────────────
    useEffect(() => {
        if (autoGenerateTriggered.current) return;
        const shouldAutoGenerate = localStorage.getItem('autoGenerateForecast');
        if (shouldAutoGenerate === 'true' && uploadedData) {
            autoGenerateTriggered.current = true;
            localStorage.removeItem('autoGenerateForecast');
            generateAllForecasts();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedData]);

    // ── Generate custom range forecast ─────────────────────────────────────
    const generateCustomForecast = async () => {
        if (!customStart || !customEnd) return;
        if (!uploadedData) { setForecastError('Please upload data first'); return; }

        setIsLoading(true); setForecastError(null);
        try {
            const datasetId = uploadedData.datasetId;
            const customEndDate = new Date(customEnd);
            const customStartDate = new Date(customStart);
            const lastDataDate = new Date(uploadedData.dateRange.end.split('/').reverse().join('-'));
            const horizon_weeks = Math.min(52, Math.max(1, Math.ceil((customEndDate - lastDataDate) / (7 * 24 * 60 * 60 * 1000))));

            const forecastsCustom = [];
            for (const productName of uploadedData.products) {
                const itemId = uploadedData.itemIds[productName];
                try {
                    const response = await fetch(`http://localhost:5001/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon_weeks}&train_weeks=20&_t=${Date.now()}`);
                    const data = await response.json();
                    if (!response.ok) continue;
                    if (data?.forecast) {
                        const filteredForecast = data.forecast.filter(f => {
                            const fd = new Date(f.date); fd.setHours(0,0,0,0);
                            const cs = new Date(customStartDate); cs.setHours(0,0,0,0);
                            const ce = new Date(customEndDate); ce.setHours(0,0,0,0);
                            return fd >= cs && fd <= ce;
                        });
                        forecastsCustom.push({ ...data, forecast: filteredForecast, item_name: uploadedData.displayName || productName, product_name: productName });
                    }
                } catch (error) { console.error(`Error fetching custom forecast for ${productName}:`, error); }
            }
            setForecastCustom(forecastsCustom);
        } catch (error) {
            console.error('Custom forecast error:', error);
            setForecastError(error.message); setForecastCustom([]);
        } finally { setIsLoading(false); }
    };

    // ── Delete dataset ─────────────────────────────────────────────────────
    const handleDeleteDataset = async () => {
        if (!window.confirm(`Delete "${uploadedData.displayName || uploadedData.fileName}" and all associated data from the database?`)) return;
        try {
            const response = await fetch(`http://localhost:5001/api/upload/dataset/${uploadedData.datasetId}`, { method: 'DELETE' });
            if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to delete dataset'); }

            const updatedDatasets = allDatasets.filter(d => d.datasetId !== uploadedData.datasetId);
            setAllDatasets(updatedDatasets);
            localStorage.setItem('uploadedForecastData', JSON.stringify(updatedDatasets));

            if (updatedDatasets.length > 0) {
                setSelectedDatasetId(updatedDatasets[0].datasetId); setUploadedData(updatedDatasets[0]);
                localStorage.setItem('selectedDatasetId', updatedDatasets[0].datasetId.toString());
            } else {
                setUploadedData(null); setSelectedDatasetId(null); localStorage.removeItem('selectedDatasetId');
            }
            setForecast7Days([]); setForecastMonth([]); setForecastYear([]); setHasGenerated(false);
        } catch (error) { console.error('Failed to delete dataset:', error); alert(`Failed to delete dataset: ${error.message}`); }
    };

    // ── Derived data ───────────────────────────────────────────────────────
    const getCurrentForecast = () => {
        if (forecastRange === '7days') return forecast7Days;
        if (forecastRange === 'upcomingMonth') return forecastMonth;
        if (forecastRange === 'upcomingYear') return forecastYear;
        if (forecastRange === 'custom') return forecastCustom;
        return null;
    };

    const currentForecasts = getCurrentForecast();

    const getRangeLabel = () => {
        if (forecastRange === 'custom' && customStart && customEnd) return `${customStart} to ${customEnd}`;
        return FORECAST_RANGE_OPTIONS.find((o) => o.value === forecastRange)?.label || 'Next 7 days';
    };

    const chartDataByProduct = currentForecasts?.length > 0
        ? currentForecasts.map((forecast, idx) => ({
            productName: forecast.product_name || forecast.item_name,
            colorIndex: idx,
            data: forecast.forecast ? transformProphetData(forecast.forecast, forecastRange) : []
        }))
        : [];

    const filteredChartData = selectedProduct === 'all'
        ? chartDataByProduct
        : chartDataByProduct.filter(item => item.productName === selectedProduct);

    const availableProducts = chartDataByProduct.map(item => item.productName);

    const displayedForecasts = currentForecasts?.length > 0
        ? (selectedProduct === 'all' ? currentForecasts : currentForecasts.filter(f => (f.product_name || f.item_name) === selectedProduct))
        : [];

    const totalForecast = displayedForecasts.length > 0
        ? displayedForecasts.reduce((sum, f) => sum + (f.forecast ? f.forecast.reduce((s, p) => s + p.yhat, 0) : 0), 0)
        : null;

    const forecastTrend = calcForecastTrend(displayedForecasts);

    const graphTitle = currentForecasts?.length > 0
        ? `${uploadedData?.displayName || 'Products'} Forecast`
        : 'Generate forecast to view predictions';
    const graphValue = totalForecast ? `${Math.round(totalForecast)} units` : 'N/A';
    const graphChange = forecastTrend !== null ? `${Math.abs(forecastTrend).toFixed(1)}%` : 'N/A';
    const graphIsPositive = forecastTrend !== null ? forecastTrend >= 0 : true;

    const quickStats = currentForecasts?.length > 0 ? [
        { label: 'Training Data', value: `${getTrainingDays(uploadedData?.dateRange)} days`, change: `${currentForecasts[0].train_weeks || 20}w`, positive: null, icon: FaCheckDouble },
        { label: 'Products', value: `${currentForecasts.length}`, change: 'Prophet', positive: null, icon: FaPoundSign },
        { label: 'Predictions', value: `${currentForecasts[0].forecast.length}`, change: 'days', positive: null, icon: FaShoppingBag },
    ] : [];

    const getLastUpdatedText = () => {
        if (!lastGenerated) return 'No forecast generated yet';
        return `Forecast generated at ${lastGenerated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="ml-0 md:ml-64 flex-1 min-w-0 min-h-screen bg-dashboard-gradient p-4 md:p-8 transition-all duration-300 relative">
            {isLoading && <LoadingOverlay />}

            <nav className="mb-6 mt-16 md:mt-0 flex items-center gap-2 text-sm text-pinkcafe2/60">
                <Link to="/home" className="hover:text-pinkcafe2 transition-colors flex items-center gap-1">
                    <FaHome className="text-xs" /> Home
                </Link>
                <span>/</span>
                <span className="text-pinkcafe2 font-medium">Dashboard</span>
            </nav>

            <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-black mb-2 tracking-tight">Sales Forecasting</h1>
                <p className="text-black/80 text-base max-w-xl mb-2">AI-powered product demand predictions to reduce waste and optimize inventory</p>
                <div className="flex items-center gap-4">
                    <p className="text-xs text-black font-bold">{getLastUpdatedText()}</p>
                    {hasGenerated && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-pinkcafe2 rounded-full text-xs font-semibold border border-pinkcafe2/10 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Forecast Ready
                        </span>
                    )}
                    {forecastError && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                            {forecastError}
                        </span>
                    )}
                </div>
            </div>

            <QuickStatsBar stats={quickStats} />

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
                {/* Main Chart Card */}
                <div className="flex-1 min-w-0 flex">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-white/80 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-pinkcafe2/10 hover:-translate-y-1 flex-1 flex flex-col min-h-0 w-full">
                        <div className="bg-pinkcafe2 px-6 py-5 flex-shrink-0">
                            <div className="flex items-center gap-2.5 mb-1">
                                <FaChartLine className="text-white/90 text-xl" />
                                <h2 className="text-xl md:text-2xl font-bold text-white">{graphTitle}</h2>
                            </div>
                            <p className="text-white/80 text-sm mb-1">{getRangeLabel()}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl md:text-4xl font-bold text-white">{graphValue}</span>
                                {graphChange !== 'N/A' && (
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${graphIsPositive ? 'bg-emerald-700 text-emerald-100' : 'bg-rose-700 text-rose-100'}`}>
                                        {graphChange}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {FORECAST_RANGE_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                                    <button key={opt.value} type="button" onClick={() => setForecastRange(opt.value)} disabled={!hasGenerated}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            forecastRange === opt.value ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                                        }`}>
                                        {opt.label}
                                    </button>
                                ))}
                                <button type="button" onClick={() => setForecastRange('custom')}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        forecastRange === 'custom' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                                    }`}>
                                    Custom
                                </button>
                                {hasGenerated && availableProducts.length > 0 && (
                                    <>
                                        <span className="text-white/60 text-xs mx-1">|</span>
                                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                                            className="rounded-md px-3 py-1.5 text-xs font-medium bg-white/10 text-white border-0 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/50 cursor-pointer">
                                            <option value="all" className="bg-pinkcafe2 text-white">All Products</option>
                                            {availableProducts.map(name => (
                                                <option key={name} value={name} className="bg-pinkcafe2 text-white">{name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                            {forecastRange === 'custom' && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <input type="date" value={customStart} min={new Date().toISOString().split('T')[0]} max="2026-10-09"
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <span className="text-white/80 text-xs">to</span>
                                    <input type="date" value={customEnd} min={customStart || new Date().toISOString().split('T')[0]} max="2026-10-09"
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <button type="button" onClick={generateCustomForecast} disabled={isLoading || !customStart || !customEnd}
                                        className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all bg-white text-pinkcafe2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed ml-auto">
                                        {isLoading ? 'Loading...' : 'Generate Custom'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="bg-white flex-1 min-h-[280px] p-5 md:p-7 flex flex-col transition-all duration-500">
                            {filteredChartData.length > 0 ? (
                                <>
                                    <div className="flex-1 min-h-0">
                                        <MultiLineChart dataByProduct={filteredChartData} dataKey="predicted" />
                                    </div>
                                    <ChartLegend data={filteredChartData} />
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-pinkcafe2/30 text-sm">
                                    No forecast data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-full lg:w-64 xl:w-72 flex flex-col gap-4 flex-shrink-0">
                    <DatasetSelector allDatasets={allDatasets} selectedDatasetId={selectedDatasetId} onDatasetChange={handleDatasetChange} />
                    <DatasetPanel uploadedData={uploadedData} onDelete={handleDeleteDataset} />
                    <ForecastControlPanel isLoading={isLoading} hasGenerated={hasGenerated} uploadedData={uploadedData} onGenerate={generateAllForecasts} />
                    <InsightsPanel currentForecasts={currentForecasts} uploadedData={uploadedData} />
                    <ModelPanel currentForecasts={currentForecasts} />
                </div>
            </div>
        </div>
    );
}

export default LandingPagePanel;
