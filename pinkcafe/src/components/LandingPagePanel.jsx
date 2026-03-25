import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaBullseye, FaShoppingBag, FaTrophy, FaDownload, FaHome, FaTable } from 'react-icons/fa';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { authFetch } from '../utils/apiUtils';
import { filterForecastFromToday, transformProphetData, calcForecastTrend, getTrainingDays, getMaxForecastMonths, CHART_COLORS } from '../utils/chartUtils';
import MultiLineChart from './landing/MultiLineChart';
import { LoadingOverlay, ChartLegend, DatasetSelector } from './landing/Widgets';
import { InsightsPanel, ModelPanel, ForecastControlPanel } from './landing/Panels';
import ComparisonPanel from './landing/ComparisonPanel';

// ===========================================================================
// Main component
// ===========================================================================

function LandingPagePanel() {
    const autoGenerateTriggered = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [forecastRange, setForecastRange] = useState('7days');
    const [viewMode, setViewMode] = useState('graph');
    const [tableMode, setTableMode] = useState('grouped');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('all');

    const [forecast7Days, setForecast7Days] = useState([]);
    const [forecast8Weeks, setForecast8Weeks] = useState([]);
    const [forecastMonth, setForecastMonth] = useState([]);
    const [forecastYear, setForecastYear] = useState([]);
    const [forecastCustom, setForecastCustom] = useState([]);
    const [forecastError, setForecastError] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);
    const [prophetMetrics, setProphetMetrics] = useState(null);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);

    const [allDatasets, setAllDatasets] = useState([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState(null);
    const [uploadedData, setUploadedData] = useState(null);

    const maxForecastMonths = getMaxForecastMonths(uploadedData?.dateRange?.end);

    const FORECAST_RANGE_OPTIONS = [
        { value: '7days', label: 'Next 7 days' },
        { value: 'upcomingMonth', label: 'Next 4 weeks' },
        { value: '8weeks', label: 'Next 8 weeks' },
        { value: 'upcomingYear', label: `Next ${maxForecastMonths} month${maxForecastMonths !== 1 ? 's' : ''}` },
        { value: 'custom', label: 'Custom dates' },
    ];

    const activePeriodIndex = Math.max(0, FORECAST_RANGE_OPTIONS.findIndex((o) => o.value === forecastRange));

    // ── Load persisted datasets for the current user on mount ─────────────
    useEffect(() => {
        let isMounted = true;

        const hydrateFromDatasets = (datasets) => {
            if (!isMounted) return;

            const normalized = Array.isArray(datasets) ? datasets : [];
            setAllDatasets(normalized);

            if (normalized.length === 0) {
                setSelectedDatasetId(null);
                setUploadedData(null);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_DATASET);
                return;
            }

            const selectedId = localStorage.getItem(STORAGE_KEYS.SELECTED_DATASET);
            const selectedDataset = selectedId
                ? normalized.find(d => d.datasetId.toString() === selectedId)
                : null;
            const chosenDataset = selectedDataset || normalized[0];

            setSelectedDatasetId(chosenDataset.datasetId);
            setUploadedData(chosenDataset);
            localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, chosenDataset.datasetId.toString());
        };

        const loadDatasets = async () => {
            try {
                const response = await authFetch(`${API_BASE_URL}/api/upload/datasets`);
                const body = await response.json();
                if (!response.ok) throw new Error(body.message || 'Failed to load datasets');

                const datasets = Array.isArray(body.datasets) ? body.datasets : [];
                localStorage.setItem(STORAGE_KEYS.FORECAST_DATA, JSON.stringify(datasets));
                hydrateFromDatasets(datasets);
            } catch (error) {
                console.error('Failed to load datasets from API, clearing stale local cache:', error);
                localStorage.removeItem(STORAGE_KEYS.FORECAST_DATA);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_DATASET);
                hydrateFromDatasets([]);
            }
        };

        loadDatasets();

        return () => {
            isMounted = false;
        };
    }, []);

    // ── Dataset switching ──────────────────────────────────────────────────
    const handleDatasetChange = (datasetId) => {
        const dataset = allDatasets.find(d => d.datasetId === datasetId);
        if (!dataset) return;
        setSelectedDatasetId(datasetId);
        setUploadedData(dataset);
        localStorage.setItem(STORAGE_KEYS.SELECTED_DATASET, datasetId.toString());
        setForecast7Days([]); setForecastMonth([]); setForecastYear([]); setForecastCustom([]);
        setHasGenerated(false); setComparisonResults(null); setProphetMetrics(null);
    };

    // ── Generate all forecasts ─────────────────────────────────────────────
    const generateAllForecasts = async () => {
        if (!uploadedData) { setForecastError('Please upload data first'); return; }

        setIsLoading(true);
        setForecastError(null);
        setForecast7Days([]); setForecast8Weeks([]); setForecastMonth([]); setForecastYear([]);

        try {
            const datasetId = uploadedData.datasetId;
            const lastDataDate = new Date(uploadedData.dateRange.end.split('/').reverse().join('-'));
            const today = new Date();
            const weeksFromLastData = Math.ceil((today - lastDataDate) / (7 * 24 * 60 * 60 * 1000));

            const horizon7Days = Math.min(52, weeksFromLastData + 1);
            const horizon8Weeks = Math.min(52, weeksFromLastData + 8);
            const horizonMonth = Math.min(52, weeksFromLastData + 4);
            const targetEndDate = new Date(today);
            targetEndDate.setDate(targetEndDate.getDate() + Math.ceil(maxForecastMonths * 30.44));
            const horizonYear = Math.min(52, Math.max(1, Math.ceil((targetEndDate - lastDataDate) / (7 * 24 * 60 * 60 * 1000))));

            const forecasts7Days = [], forecasts8Weeks = [], forecastsMonth = [], forecastsYear = [];

            for (const productName of uploadedData.products) {
                const itemId = uploadedData.itemIds[productName];
                const displayName = uploadedData.displayName || productName;
                try {
                    const [res7, res8, resM, resY] = await Promise.all([
                        authFetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon7Days}&train_weeks=20&_t=${Date.now()}`),
                        authFetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon8Weeks}&train_weeks=20&_t=${Date.now()}`),
                        authFetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizonMonth}&train_weeks=20&_t=${Date.now()}`),
                        authFetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizonYear}&train_weeks=20&_t=${Date.now()}`),
                    ]);
                    const [data7, data8, dataM, dataY] = await Promise.all([res7.json(), res8.json(), resM.json(), resY.json()]);
                    if (res7.ok) forecasts7Days.push({ ...filterForecastFromToday(data7), item_name: displayName, product_name: productName });
                    if (res8.ok) forecasts8Weeks.push({ ...filterForecastFromToday(data8), item_name: displayName, product_name: productName });
                    if (resM.ok) forecastsMonth.push({ ...filterForecastFromToday(dataM), item_name: displayName, product_name: productName });
                    if (resY.ok) forecastsYear.push({ ...filterForecastFromToday(dataY), item_name: displayName, product_name: productName });
                } catch (error) { console.error(`Error fetching forecast for ${productName}:`, error); }
            }

            setForecast7Days(forecasts7Days); setForecast8Weeks(forecasts8Weeks); setForecastMonth(forecastsMonth); setForecastYear(forecastsYear);
            setHasGenerated(true); setLastGenerated(new Date());
        } catch (error) {
            console.error('Forecast error:', error);
            setForecastError(error.message);
            setForecast7Days([]); setForecast8Weeks([]); setForecastMonth([]); setForecastYear([]); setHasGenerated(false);
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

    // ── Fetch Prophet metrics when product/dataset changes ─────────────────
    useEffect(() => {
        if (!hasGenerated || !uploadedData || !selectedDatasetId) { setProphetMetrics(null); return; }
        const items = uploadedData.itemIds || {};
        const products = uploadedData.products || [];
        if (products.length === 0) return;

        let cancelled = false;
        const fetchMetrics = async () => {
            try {
                if (selectedProduct === 'all') {
                    // Average across all products
                    const allRes = await Promise.all(
                        products.map(name =>
                            authFetch(`${API_BASE_URL}/api/v1/forecast/compare?dataset_id=${selectedDatasetId}&item_id=${items[name]}&train_weeks=20&test_days=14`)
                                .then(r => r.json())
                        )
                    );
                    const valid = allRes.map(r => r.results?.prophet).filter(p => p && !p.error);
                    if (!cancelled && valid.length > 0) {
                        setProphetMetrics({
                            mae: Math.round(valid.reduce((s, v) => s + v.mae, 0) / valid.length * 100) / 100,
                            mse: Math.round(valid.reduce((s, v) => s + v.mse, 0) / valid.length * 100) / 100,
                        });
                    }
                } else {
                    const itemId = items[selectedProduct];
                    if (!itemId) return;
                    const res = await authFetch(`${API_BASE_URL}/api/v1/forecast/compare?dataset_id=${selectedDatasetId}&item_id=${itemId}&train_weeks=20&test_days=14`);
                    const data = await res.json();
                    if (!cancelled && res.ok && data.results?.prophet && !data.results.prophet.error) {
                        setProphetMetrics(data.results.prophet);
                    }
                }
            } catch (e) { console.error('Failed to fetch Prophet metrics:', e); }
        };
        fetchMetrics();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct, selectedDatasetId, hasGenerated]);

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
                    const response = await authFetch(`${API_BASE_URL}/api/v1/forecast?dataset_id=${datasetId}&item_id=${itemId}&algorithm=prophet&horizon_weeks=${horizon_weeks}&train_weeks=20&_t=${Date.now()}`);
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
            const response = await authFetch(`${API_BASE_URL}/api/upload/dataset/${uploadedData.datasetId}`, { method: 'DELETE' });
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
            setForecast7Days([]); setForecastMonth([]); setForecastYear([]); setForecastCustom([]); setHasGenerated(false);
            setProphetMetrics(null); setComparisonResults(null); setForecastError(null); setLastGenerated(null); setSelectedProduct('all');
        } catch (error) { console.error('Failed to delete dataset:', error); alert(`Failed to delete dataset: ${error.message}`); }
    };

    // ── Derived data ───────────────────────────────────────────────────────
    const getCurrentForecast = () => {
        if (forecastRange === '7days') return forecast7Days;
        if (forecastRange === '8weeks') return forecast8Weeks;
        if (forecastRange === 'upcomingMonth') return forecastMonth;
        if (forecastRange === 'upcomingYear') return forecastYear;
        if (forecastRange === 'custom') return forecastCustom;
        return null;
    };

    const currentForecasts = getCurrentForecast();
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

    const quickStats = prophetMetrics ? [
        { label: 'Total Forecast', value: totalForecast ? `${Math.round(totalForecast).toLocaleString()}` : '—', change: 'units', positive: null, icon: FaShoppingBag },
        { label: 'Prophet MAE', value: `${prophetMetrics.mae}`, change: 'Mean Absolute Error', positive: null, icon: FaBullseye },
        { label: 'Prophet MSE', value: `${prophetMetrics.mse}`, change: 'Mean Squared Error', positive: null, icon: FaChartLine },
    ] : [];
    
    const getRawPointsForRange = (forecastPoints) => {
        if (!Array.isArray(forecastPoints) || forecastPoints.length === 0) return [];

        if (forecastRange === '7days') return forecastPoints.slice(0, 7);
        if (forecastRange === 'upcomingMonth') return forecastPoints.slice(0, 28);
        if (forecastRange === '8weeks') return forecastPoints.slice(0, 56);
        return forecastPoints;
    };

    const productColorMap = chartDataByProduct.reduce((acc, item, idx) => {
        const colorIndex = item.colorIndex ?? idx;
        acc[item.productName] = CHART_COLORS[colorIndex % CHART_COLORS.length];
        return acc;
    }, {});

    const parseSortDate = (dateLike) => {
        const parsed = Date.parse(dateLike);
        return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    };

    const groupedTableRows = filteredChartData.flatMap((series) =>
        (series.data || []).map((point, idx) => ({
            key: `${series.productName}-grouped-${idx}`,
            product: series.productName,
            periodLabel: point.day,
            dateLabel: point.date,
            predicted: Number(point.predicted ?? 0),
            sortDate: parseSortDate(`${point.date} ${new Date().getFullYear()}`),
            productColor: productColorMap[series.productName] || CHART_COLORS[0],
        }))
    );

    const rawTableRows = displayedForecasts.flatMap((forecast, idx) => {
        const product = forecast.product_name || forecast.item_name || `Product ${idx + 1}`;
        const points = getRawPointsForRange(forecast.forecast || []);

        return points.map((point, pointIdx) => {
            const date = new Date(point.date);
            return {
                key: `${product}-raw-${pointIdx}`,
                product,
                periodLabel: Number.isNaN(date.getTime())
                    ? 'N/A'
                    : date.toLocaleDateString('en-GB', { weekday: 'short' }),
                dateLabel: Number.isNaN(date.getTime())
                    ? String(point.date || 'N/A')
                    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                predicted: Math.round((Number(point.yhat) || 0) * 10) / 10,
                sortDate: Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime(),
                productColor: productColorMap[product] || CHART_COLORS[0],
            };
        });
    });

    const activeTableRows = (tableMode === 'grouped' ? groupedTableRows : rawTableRows)
        .slice()
        .sort((a, b) => {
            if (a.sortDate !== b.sortDate) return a.sortDate - b.sortDate;
            return a.product.localeCompare(b.product);
        });

    const graphTitle = currentForecasts?.length > 0
        ? `${uploadedData?.displayName || 'Products'} Forecast`
        : 'Generate forecast to view predictions';
    const graphValue = totalForecast ? `${Math.round(totalForecast).toLocaleString()} units` : 'N/A';
    const graphChange = forecastTrend !== null ? `${Math.abs(forecastTrend).toFixed(1)}%` : 'N/A';
    const graphIsPositive = forecastTrend !== null ? forecastTrend >= 0 : true;



    const exportCSV = () => {
        if (!displayedForecasts || displayedForecasts.length === 0) return;
        // Collect all unique dates
        const dateMap = {};
        displayedForecasts.forEach(f => {
            const name = f.product_name || f.item_name;
            (f.forecast || []).forEach(p => {
                if (!dateMap[p.date]) dateMap[p.date] = {};
                dateMap[p.date][name] = Math.round(p.yhat * 10) / 10;
            });
        });
        const products = displayedForecasts.map(f => f.product_name || f.item_name);
        const rows = [['Date', ...products].join(',')];
        Object.keys(dateMap).sort().forEach(date => {
            rows.push([date, ...products.map(p => dateMap[date][p] ?? '')].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `forecast_${forecastRange}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

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

            <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 mb-6 animate-fade-in-up">
                <div className="px-5 md:px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Sales Forecasting</h1>
                            <p className="text-pinkcafe2/60 text-sm mt-1">AI-powered product demand predictions</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] text-pinkcafe2/50">{getLastUpdatedText()}</p>
                            {hasGenerated && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    Ready
                                </span>
                            )}
                            {forecastError && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-semibold border border-rose-200">
                                    {forecastError}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {quickStats.length > 0 && (
                    <div className="border-t border-pinkcafe2/10">
                        <div className="grid grid-cols-3 divide-x divide-pinkcafe2/10">
                            {quickStats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-pinkcafe2/10 flex items-center justify-center shrink-0">
                                            <Icon className="text-pinkcafe2 text-sm" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-pinkcafe2/50 font-semibold uppercase tracking-wider">{stat.label}</p>
                                            <p className="text-lg font-bold text-pinkcafe2 leading-tight">{stat.value}</p>
                                        </div>
                                        {stat.change && (
                                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-pinkcafe2/8 text-pinkcafe2/60">
                                                {stat.change}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-6 w-full">
                {/* Main Chart Card */}
                <div className="flex-1 min-w-0 flex animate-scale-in animate-delay-150">
                    <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 flex-1 flex flex-col w-full">
                        <div className="bg-pinkcafe2 px-5 md:px-6 py-4 flex-shrink-0">
                            <div className="flex items-center gap-2.5 mb-1">
                                <h2 className="text-lg md:text-xl font-bold text-white">{graphTitle}</h2>
                            </div>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl md:text-4xl font-bold text-white">{graphValue}</span>
                                {graphChange !== 'N/A' && (
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${graphIsPositive ? 'bg-emerald-700 text-emerald-100' : 'bg-rose-700 text-rose-100'}`}>
                                        {graphChange}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap min-[1250px]:flex-nowrap items-center gap-1.5 min-w-0">
                                <div className="relative grid grid-cols-5 rounded-lg bg-white/10 p-px min-w-0 basis-full w-full min-[1250px]:basis-auto min-[1250px]:w-auto min-[1250px]:flex-1">
                                    <span
                                        className="pointer-events-none absolute left-px top-px bottom-px rounded-md bg-white shadow-sm transition-transform duration-300 ease-out"
                                        style={{
                                            width: `calc((100% - 2px) / ${FORECAST_RANGE_OPTIONS.length})`,
                                            transform: `translateX(${activePeriodIndex * 100}%)`,
                                        }}
                                    />
                                    {FORECAST_RANGE_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                                        <button key={opt.value} type="button" onClick={() => setForecastRange(opt.value)} disabled={!hasGenerated}
                                            className={`relative z-10 w-full min-w-0 min-h-[34px] rounded-md px-2 py-1.5 text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-center font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                forecastRange === opt.value
                                                    ? 'text-pinkcafe2'
                                                    : 'text-white/80 hover:text-white'
                                            }`}>
                                            {opt.label}
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => setForecastRange('custom')}
                                        className={`relative z-10 w-full min-w-0 min-h-[34px] rounded-md px-2 py-1.5 text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis text-center font-medium transition-colors duration-200 ${
                                            forecastRange === 'custom'
                                                ? 'text-pinkcafe2'
                                                : 'text-white/80 hover:text-white'
                                        }`}>
                                        Custom
                                    </button>
                                </div>
                                {hasGenerated && availableProducts.length > 0 && (
                                    <>
                                        <span className="hidden sm:inline text-white/30 text-xs mx-1">|</span>
                                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-white/10 text-white border border-white/10 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer backdrop-blur-sm shrink-0">
                                            <option value="all" className="bg-pinkcafe2 text-white">All Products</option>
                                            {availableProducts.map(name => (
                                                <option key={name} value={name} className="bg-pinkcafe2 text-white">{name}</option>
                                            ))}
                                        </select>
                                        <span className="hidden sm:inline text-white/30 text-xs mx-1">|</span>
                                        <button type="button" onClick={exportCSV}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 shrink-0">
                                            <FaDownload className="text-[10px]" /> Export CSV
                                        </button>
                                    </>
                                )}
                            </div>
                            {forecastRange === 'custom' && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <input type="date" value={customStart} min={new Date().toISOString().split('T')[0]} max="2026-10-09"
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="rounded-lg bg-white border-0 px-3 py-1.5 text-xs text-pinkcafe2 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <span className="text-white/80 text-xs font-medium">to</span>
                                    <input type="date" value={customEnd} min={customStart || new Date().toISOString().split('T')[0]} max="2026-10-09"
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="rounded-lg bg-white border-0 px-3 py-1.5 text-xs text-pinkcafe2 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <button type="button" onClick={generateCustomForecast} disabled={isLoading || !customStart || !customEnd}
                                        className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all bg-white text-pinkcafe2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ml-auto">
                                        {isLoading ? 'Loading...' : 'Generate Custom'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="bg-white flex-1 min-h-[340px] p-4 md:p-6 flex flex-col transition-all duration-500 overflow-hidden">
                            {comparisonResults && (
                                <div className="mb-4 pb-4 border-b border-pinkcafe2/10">
                                    <p className="text-[10px] text-pinkcafe2/50 uppercase tracking-wider font-semibold mb-2">Algorithm Comparison — {comparisonResults._label}</p>
                                    <div className="flex gap-3">
                                        {['prophet', 'sarima', 'linear_regression'].map(key => {
                                            const val = comparisonResults.results[key];
                                            if (!val) return null;
                                            const isBest = comparisonResults._best === key;
                                            const labels = { prophet: 'Prophet', sarima: 'SARIMA', linear_regression: 'Linear Regression' };
                                            return (
                                                <div key={key} className={`flex-1 rounded-lg border p-2.5 ${isBest ? 'border-emerald-200 bg-emerald-50/50' : 'border-pinkcafe2/8 bg-pinkcafe2/[0.02]'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        {isBest && <FaTrophy className="text-amber-500 text-[9px]" />}
                                                        <span className="text-[11px] font-bold text-pinkcafe2">{labels[key] || key}</span>
                                                        {isBest && <span className="text-[8px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full ml-auto">Best</span>}
                                                    </div>
                                                    {val.error ? (
                                                        <p className="text-[10px] text-pinkcafe2/40 italic">Failed</p>
                                                    ) : (
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <p className="text-[9px] text-pinkcafe2/50">MAE</p>
                                                                <p className={`text-sm font-bold font-mono ${isBest ? 'text-emerald-600' : 'text-pinkcafe2'}`}>{val.mae}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] text-pinkcafe2/50">MSE</p>
                                                                <p className={`text-sm font-bold font-mono ${isBest ? 'text-emerald-600' : 'text-pinkcafe2'}`}>{val.mse}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[9px] text-pinkcafe2/40 mt-2">Test: {comparisonResults.test_period.start} to {comparisonResults.test_period.end} ({comparisonResults.test_days}d)</p>
                                </div>
                            )}
                            {filteredChartData.length > 0 ? (
                                <>
                                    <div className="mb-0 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                                        <div className="relative inline-grid grid-cols-2 items-center border-b border-pinkcafe2/15 px-2 col-start-2 justify-self-center">
                                            <span
                                                className={`pointer-events-none absolute -bottom-px left-1 h-[2px] w-[calc(50%-4px)] rounded-full bg-pinkcafe2 transition-transform duration-300 ease-out ${
                                                    viewMode === 'graph' ? 'translate-x-0' : 'translate-x-full'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('graph')}
                                                className={`relative inline-flex items-center justify-center gap-2 px-3 pb-2.5 text-sm font-semibold tracking-wide transition-all duration-200 ${
                                                    viewMode === 'graph'
                                                        ? 'text-pinkcafe2'
                                                        : 'text-pinkcafe2/55 hover:text-pinkcafe2/85'
                                                }`}
                                                aria-pressed={viewMode === 'graph'}
                                            >
                                                <FaChartLine className="text-[13px]" />
                                                Graph
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('table')}
                                                className={`relative inline-flex items-center justify-center gap-2 px-3 pb-2.5 text-sm font-semibold tracking-wide transition-all duration-200 ${
                                                    viewMode === 'table'
                                                        ? 'text-pinkcafe2'
                                                        : 'text-pinkcafe2/55 hover:text-pinkcafe2/85'
                                                }`}
                                                aria-pressed={viewMode === 'table'}
                                            >
                                                <FaTable className="text-[13px]" />
                                                Table
                                            </button>
                                        </div>

                                        <div
                                            className={`relative inline-grid grid-cols-2 items-center p-1 col-start-3 justify-self-end w-[146px] transition-opacity duration-150 ${
                                                viewMode === 'table' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                            }`}
                                            aria-hidden={viewMode !== 'table'}
                                        >
                                            <span
                                                className={`pointer-events-none absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-pinkcafe2 shadow-sm transition-transform duration-300 ease-out ${
                                                    tableMode === 'grouped' ? 'translate-x-0' : 'translate-x-full'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setTableMode('grouped')}
                                                className={`relative z-10 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                                    tableMode === 'grouped'
                                                        ? 'text-white'
                                                        : 'text-pinkcafe2 hover:text-pinkcafe2/90 hover:-translate-y-px'
                                                }`}
                                                aria-pressed={tableMode === 'grouped'}
                                                tabIndex={viewMode === 'table' ? 0 : -1}
                                            >
                                                Grouped
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTableMode('raw')}
                                                className={`relative z-10 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                                    tableMode === 'raw'
                                                        ? 'text-white'
                                                        : 'text-pinkcafe2 hover:text-pinkcafe2/90 hover:-translate-y-px'
                                                }`}
                                                aria-pressed={tableMode === 'raw'}
                                                tabIndex={viewMode === 'table' ? 0 : -1}
                                            >
                                                Raw
                                            </button>
                                        </div>
                                    </div>

                                    {viewMode === 'graph' ? (
                                        <>
                                            <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                                                <MultiLineChart
                                                    key={`${forecastRange}-${customStart || ''}-${customEnd || ''}`}
                                                    dataByProduct={filteredChartData}
                                                    dataKey="predicted"
                                                    animationTrigger={`${forecastRange}-${customStart || ''}-${customEnd || ''}`}
                                                />
                                            </div>
                                            <ChartLegend data={filteredChartData} />
                                        </>
                                    ) : (
                                        <div className="flex-1 min-h-0 max-h-[460px] border border-pinkcafe2/10 rounded-lg overflow-y-auto overflow-x-auto">
                                            {activeTableRows.length > 0 ? (
                                                <table className="w-full min-w-[640px] text-sm">
                                                    <thead className="sticky top-0 z-10 bg-white">
                                                        <tr>
                                                            <th className="bg-gray-100 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">Product</th>
                                                            <th className="bg-gray-100 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">Day/Period</th>
                                                            <th className="bg-gray-100 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">Date</th>
                                                            <th className="bg-gray-100 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-800">Predicted Units</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-pinkcafe2/10">
                                                        {activeTableRows.map((row, idx) => (
                                                            <tr key={row.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-pinkcafe2/3'}>
                                                                <td className="px-4 py-2.5 font-medium whitespace-nowrap" style={{ color: row.productColor }}>
                                                                    {row.product}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-pinkcafe2/85 whitespace-nowrap">{row.periodLabel}</td>
                                                                <td className="px-4 py-2.5 text-pinkcafe2/85 whitespace-nowrap">{row.dateLabel}</td>
                                                                <td className="px-4 py-2.5 text-right text-pinkcafe2 font-semibold whitespace-nowrap">{row.predicted.toFixed(1)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-pinkcafe2/40 text-sm">
                                                    No table data available
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                        <ForecastControlPanel isLoading={isLoading} hasGenerated={hasGenerated} uploadedData={uploadedData} onGenerate={generateAllForecasts} onDelete={handleDeleteDataset} />
                    </div>
                    <div className="animate-slide-in-right animate-delay-500">
                        <ComparisonPanel
                            datasetId={selectedDatasetId}
                            uploadedData={uploadedData}
                            selectedProduct={selectedProduct}
                            onResults={setComparisonResults}
                            loading={comparisonLoading}
                            setLoading={setComparisonLoading}
                        />
                    </div>
                    <div className="animate-slide-in-right animate-delay-600">
                        <ModelPanel currentForecasts={displayedForecasts} uploadedData={uploadedData} />
                    </div>
                    <div className="animate-slide-in-right animate-delay-700 flex-1 flex">
                        <div className="flex-1">
                            <InsightsPanel currentForecasts={displayedForecasts} uploadedData={uploadedData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPagePanel;
