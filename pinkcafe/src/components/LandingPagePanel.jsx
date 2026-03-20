import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPoundSign, FaChartLine, FaShoppingBag, FaCheckDouble, FaHome } from 'react-icons/fa';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { filterForecastFromToday, transformProphetData, calcForecastTrend, getTrainingDays, getMaxForecastMonths } from '../utils/chartUtils';
import MultiLineChart from './landing/MultiLineChart';
import { LoadingOverlay, QuickStatsBar, ChartLegend, DatasetSelector } from './landing/Widgets';
import { InsightsPanel, ModelPanel, ForecastControlPanel, DatasetPanel } from './landing/Panels';

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
        const storedData = localStorage.getItem(STORAGE_KEYS.FORECAST_DATA);
        if (!storedData) return;
        try {
            const data = JSON.parse(storedData);
            if (Array.isArray(data)) {
                setAllDatasets(data);
                const selectedId = localStorage.getItem(STORAGE_KEYS.SELECTED_DATASET);
                if (selectedId) {
                    const dataset = data.find(d => d.datasetId.toString() === selectedId);
                    if (dataset) { setSelectedDatasetId(parseInt(selectedId)); setUploadedData(dataset); }
                    else if (data.length > 0) { setSelectedDatasetId(data[0].datasetId); setUploadedData(data[0]); localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, data[0].datasetId.toString()); }
                } else if (data.length > 0) {
                    setSelectedDatasetId(data[0].datasetId); setUploadedData(data[0]); localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, data[0].datasetId.toString());
                }
            } else {
                const dataArray = [data];
                setAllDatasets(dataArray); setSelectedDatasetId(data.datasetId); setUploadedData(data);
                localStorage.setItem(STORAGE_KEYS.FORECAST_DATA, JSON.stringify(dataArray));
                localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, data.datasetId.toString());
            }
        } catch (err) { console.error('Failed to parse uploaded data:', err); }
    }, []);

    // ── Dataset switching ──────────────────────────────────────────────────
    const handleDatasetChange = (datasetId) => {
        const dataset = allDatasets.find(d => d.datasetId === datasetId);
        if (!dataset) return;
        setSelectedDatasetId(datasetId);
        setUploadedData(dataset);
        localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, datasetId.toString());
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
                        fetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon7Days}&train_weeks=20&_t=${Date.now()}`),
                        fetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizonMonth}&train_weeks=20&_t=${Date.now()}`),
                        fetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizonYear}&train_weeks=20&_t=${Date.now()}`),
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
        const shouldAutoGenerate = localStorage.getItem(STORAGE_KEYS.AUTO_FORECAST);
        if (shouldAutoGenerate === 'true' && uploadedData) {
            autoGenerateTriggered.current = true;
            localStorage.removeItem(STORAGE_KEYS.AUTO_FORECAST);
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
                    const response = await fetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon_weeks}&train_weeks=20&_t=${Date.now()}`);
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
            const response = await fetch(`${API_BASE_URL}/api/upload/dataset/${uploadedData.datasetId}`, { method: 'DELETE' });
            if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to delete dataset'); }

            const updatedDatasets = allDatasets.filter(d => d.datasetId !== uploadedData.datasetId);
            setAllDatasets(updatedDatasets);
            localStorage.setItem(STORAGE_KEYS.FORECAST_DATA, JSON.stringify(updatedDatasets));

            if (updatedDatasets.length > 0) {
                setSelectedDatasetId(updatedDatasets[0].datasetId); setUploadedData(updatedDatasets[0]);
                localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, updatedDatasets[0].datasetId.toString());
            } else {
                setUploadedData(null); setSelectedDatasetId(null); localStorage.removeItem(STORAGE_KEYS.SELECTED_DATASET);
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

            <nav className="mb-6 mt-16 md:mt-0 flex items-center gap-2 text-sm text-pinkcafe2/60 animate-fade-in">
                <Link to="/home" className="hover:text-pinkcafe2 transition-colors flex items-center gap-1">
                    <FaHome className="text-xs" /> Home
                </Link>
                <span>/</span>
                <span className="text-pinkcafe2 font-medium">Dashboard</span>
            </nav>

            <div className="mb-10 animate-fade-in-up">
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

            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 w-full">
                {/* Main Chart Card */}
                <div className="flex-1 min-w-0 flex animate-scale-in animate-delay-150">
                    <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 flex-1 flex flex-col min-h-0 w-full">
                        <div className="bg-pinkcafe2 px-5 md:px-6 py-4 flex-shrink-0">
                            <div className="flex items-center gap-2.5 mb-1">
                                <FaChartLine className="text-white/90 text-lg" />
                                <h2 className="text-lg md:text-xl font-bold text-white">{graphTitle}</h2>
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
                        <div className="bg-white flex-1 min-h-[280px] p-4 md:p-6 flex flex-col transition-all duration-500 overflow-hidden">
                            {filteredChartData.length > 0 ? (
                                <>
                                    <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
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
                    <div className="animate-slide-in-right animate-delay-300">
                        <DatasetSelector allDatasets={allDatasets} selectedDatasetId={selectedDatasetId} onDatasetChange={handleDatasetChange} />
                    </div>
                    <div className="animate-slide-in-right animate-delay-400">
                        <DatasetPanel uploadedData={uploadedData} onDelete={handleDeleteDataset} />
                    </div>
                    <div className="animate-slide-in-right animate-delay-500">
                        <ForecastControlPanel isLoading={isLoading} hasGenerated={hasGenerated} uploadedData={uploadedData} onGenerate={generateAllForecasts} />
                    </div>
                    <div className="animate-slide-in-right animate-delay-600">
                        <InsightsPanel currentForecasts={currentForecasts} uploadedData={uploadedData} />
                    </div>
                    <div className="animate-slide-in-right animate-delay-700">
                        <ModelPanel currentForecasts={currentForecasts} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPagePanel;
