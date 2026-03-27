import React from 'react';
import { Link } from 'react-router-dom';
import { FaLightbulb, FaChartLine, FaChartBar, FaSyncAlt, FaDatabase, FaTrashAlt } from 'react-icons/fa';

export function InsightsPanel({ currentForecasts, uploadedData }) {
    const hasForecasts = currentForecasts && currentForecasts.length > 0;

    let topProduct = null, lowestProduct = null;
    let totalUnits = 0, avgDaily = 0;
    let trendDirection = null, trendPercent = null;
    let peakDay = null, productCount = 0;
    let maxDaily = 0, minDaily = Infinity;

    if (hasForecasts) {
        let maxTotal = -1, minTotal = Infinity;
        productCount = currentForecasts.length;

        currentForecasts.forEach(f => {
            const sum = (f.forecast || []).reduce((s, p) => s + p.yhat, 0);
            totalUnits += sum;
            const name = f.product_name || f.item_name;
            if (sum > maxTotal) { maxTotal = sum; topProduct = name; }
            if (sum < minTotal) { minTotal = sum; lowestProduct = name; }
        });

        const totalDays = currentForecasts[0]?.forecast?.length || 1;
        avgDaily = totalUnits / totalDays;

        // Find peak day across all products
        const dailyTotals = {};
        currentForecasts.forEach(f => {
            (f.forecast || []).forEach(p => {
                const d = p.date;
                dailyTotals[d] = (dailyTotals[d] || 0) + p.yhat;
            });
        });
        let peakVal = 0;
        Object.entries(dailyTotals).forEach(([date, val]) => {
            if (val > peakVal) { peakVal = val; peakDay = date; }
            if (val > maxDaily) maxDaily = val;
            if (val < minDaily) minDaily = val;
        });

        // Trend
        const allPoints = currentForecasts.flatMap(f => f.forecast || []);
        if (allPoints.length >= 2) {
            const mid = Math.floor(allPoints.length / 2);
            const firstAvg = allPoints.slice(0, mid).reduce((s, p) => s + p.yhat, 0) / mid;
            const secondAvg = allPoints.slice(mid).reduce((s, p) => s + p.yhat, 0) / (allPoints.length - mid);
            trendDirection = secondAvg >= firstAvg ? 'up' : 'down';
            if (firstAvg > 0) trendPercent = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1);
        }
    }

    const formatPeakDay = (d) => {
        if (!d) return null;
        const date = new Date(d);
        return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md h-full flex flex-col">
            <div className="bg-pinkcafe2 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
                <FaLightbulb className="text-white/80 text-xs" />
                <h3 className="font-bold text-white text-sm">Insights</h3>
            </div>
            <div className="bg-white p-4 flex-1">
            {hasForecasts ? (
                <ul className="space-y-2.5 text-xs text-pinkcafe2/80">
                    <li className="flex gap-2">
                        <span className="text-black mt-0.5">●</span>
                        <span>Avg daily demand: <strong className="text-pinkcafe2">{Math.round(avgDaily).toLocaleString()}</strong> units/day</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-black mt-0.5">●</span>
                        <span>Daily range: <strong className="text-pinkcafe2">{Math.round(minDaily).toLocaleString()}</strong> – <strong className="text-pinkcafe2">{Math.round(maxDaily).toLocaleString()}</strong> units</span>
                    </li>
                    {topProduct && productCount > 1 && (
                        <li className="flex gap-2">
                            <span className="text-black mt-0.5">●</span>
                            <span>Highest demand: <strong className="text-pinkcafe2">{topProduct}</strong></span>
                        </li>
                    )}
                    {lowestProduct && productCount > 1 && lowestProduct !== topProduct && (
                        <li className="flex gap-2">
                            <span className="text-black mt-0.5">●</span>
                            <span>Lowest demand: <strong className="text-pinkcafe2">{lowestProduct}</strong></span>
                        </li>
                    )}
                    {peakDay && (
                        <li className="flex gap-2">
                            <span className="text-black mt-0.5">●</span>
                            <span>Peak day: <strong className="text-pinkcafe2">{formatPeakDay(peakDay)}</strong></span>
                        </li>
                    )}
                    {trendDirection && (
                        <li className="flex gap-2">
                            <span className="text-black mt-0.5">●</span>
                            <span>Demand is <strong className={trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-500'}>{trendDirection === 'up' ? 'increasing' : 'decreasing'}{trendPercent ? ` (${trendPercent}%)` : ''}</strong></span>
                        </li>
                    )}
                    <li className="flex gap-2">
                        <span className="text-black mt-0.5">●</span>
                        <span>Forecasting <strong className="text-pinkcafe2">{productCount}</strong> product{productCount > 1 ? 's' : ''} over <strong className="text-pinkcafe2">{currentForecasts[0]?.forecast?.length || 0}</strong> days</span>
                    </li>
                    {uploadedData && (
                        <li className="flex gap-2">
                            <span className="text-black mt-0.5">●</span>
                            <span className="text-pinkcafe2/50">Training: {uploadedData.dateRange.start} – {uploadedData.dateRange.end}</span>
                        </li>
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

export function ModelPanel({ currentForecasts, uploadedData }) {
    const hasData = currentForecasts && currentForecasts.length > 0;
    const predictions = hasData ? currentForecasts[0].forecast.length : 0;
    const trainWeeks = hasData ? (currentForecasts[0].train_weeks || 20) : null;
    const productCount = hasData ? currentForecasts.length : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaChartBar className="text-xs text-pinkcafe2/50" /> Model
            </h3>
            {hasData ? (
                <ul className="space-y-1.5 text-xs text-pinkcafe2/70">
                    <li className="flex justify-between"><span>Algorithm</span><strong className="text-pinkcafe2">Prophet</strong></li>
                    <li className="flex justify-between"><span>Training</span><strong className="text-pinkcafe2">{trainWeeks} weeks</strong></li>
                    <li className="flex justify-between"><span>Products</span><strong className="text-pinkcafe2">{productCount}</strong></li>
                    <li className="flex justify-between"><span>Predictions</span><strong className="text-pinkcafe2">{predictions} days</strong></li>
                </ul>
            ) : (
                <p className="text-xs text-pinkcafe2/40">Prophet forecasting — awaiting data</p>
            )}
        </div>
    );
}

export function ForecastControlPanel({ isLoading, hasGenerated, uploadedData, onGenerate, onDelete }) {
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
                <FaDatabase className="text-xs text-pinkcafe2/50" /> Forecast Control
            </h3>
            <div className="flex flex-col gap-1 mb-3">
                <span className="text-sm text-pinkcafe2 font-semibold">
                    {uploadedData.displayName || uploadedData.products[0] || 'Uploaded Data'}
                </span>
                <p className="text-xs text-pinkcafe2/60">
                    {uploadedData.dateRange.start} - {uploadedData.dateRange.end}
                </p>
            </div>
            <div className="space-y-2">
                <button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="w-full bg-pinkcafe2 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-pinkcafe2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <FaSyncAlt className="w-3.5 h-3.5 flex-shrink-0" />
                    {isLoading ? 'Generating...' : (hasGenerated ? 'Regenerate Forecast' : 'Generate Forecast')}
                </button>
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
