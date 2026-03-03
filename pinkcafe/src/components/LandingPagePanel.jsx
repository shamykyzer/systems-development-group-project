import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPoundSign, FaChartLine, FaShoppingBag, FaCheckDouble, FaHome } from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Tiny SVG sparkline (replaces recharts AreaChart)
// ---------------------------------------------------------------------------
function Sparkline({ data, color }) {
    const w = 100, h = 32;
    const vals = data.map((d) => d.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const xs = vals.map((_, i) => (i / (vals.length - 1)) * w);
    const ys = vals.map((v) => h - ((v - min) / range) * h);
    const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
    const areaPoints = `0,${h} ${points} ${w},${h}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <polygon points={areaPoints} fill={color} fillOpacity="0.35" />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Simple SVG line chart (replaces recharts LineChart)
// ---------------------------------------------------------------------------
function SimpleLineChart({ data, dataKey = 'predicted' }) {
    const w = 400, h = 220;
    const pad = { top: 10, right: 30, bottom: 38, left: 32 }; // Increased right padding for labels
    const iw = w - pad.left - pad.right;
    const ih = h - pad.top - pad.bottom;

    const vals = data.map((d) => d[dataKey] ?? 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;

    const px = (i) => pad.left + (i / (data.length - 1)) * iw;
    const py = (v) => pad.top + ih - ((v - min) / range) * ih;

    const points = vals.map((v, i) => `${px(i)},${py(v)}`).join(' ');

    // Y-axis ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * range);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}>
            {/* Grid lines */}
            {yTicks.map((v, i) => (
                <g key={i}>
                    <line
                        x1={pad.left} y1={py(v)} x2={pad.left + iw} y2={py(v)}
                        stroke="rgba(0,0,0,0.06)" strokeDasharray="3 3"
                    />
                    <text x={pad.left - 4} y={py(v) + 4} textAnchor="end" fontSize="9" fill="#423b3980">
                        {Math.round(v)}
                    </text>
                </g>
            ))}
            {/* Line */}
            <polyline points={points} fill="none" stroke="#423b39" strokeWidth="2" strokeLinejoin="round" />
            {/* Dots */}
            {vals.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r="4" fill="#423b39" />
            ))}
            {/* X labels - day name */}
            {data.map((d, i) => (
                <text key={`day-${i}`} x={px(i)} y={h - 16} textAnchor="middle" fontSize="10" fill="#423b39" fontWeight="600">
                    {d.day}
                </text>
            ))}
            {/* X labels - date */}
            {data.map((d, i) => (
                <text key={`date-${i}`} x={px(i)} y={h - 4} textAnchor="middle" fontSize="8" fill="#423b3980">
                    {d.date}
                </text>
            ))}
        </svg>
    );
}

const FORECAST_RANGE_OPTIONS = [
    { value: '7days', label: 'Next 7 days' },
    { value: 'upcomingMonth', label: 'Next 4 weeks' },
    { value: 'upcomingYear', label: 'Long-term (7 months)' },
    { value: 'custom', label: 'Custom dates' },
];

function LandingPagePanel() {
    const [isLoading, setIsLoading] = useState(false);
    const [forecastRange, setForecastRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Prophet forecast data - store separate forecasts for each range
    const [forecast7Days, setForecast7Days] = useState(null);
    const [forecastMonth, setForecastMonth] = useState(null);
    const [forecastYear, setForecastYear] = useState(null);
    const [forecastCustom, setForecastCustom] = useState(null);
    const [forecastError, setForecastError] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [lastGenerated, setLastGenerated] = useState(null);

    // Helper function to transform Prophet forecast to chart format
    const transformProphetData = (forecast, range) => {
        if (!forecast || !forecast.length) return [];

        // Determine how many data points to show based on range
        let pointsToShow = forecast.length;
        let groupBy = 1; // days

        if (range === 'upcomingYear') {
            // Group by month for year view
            groupBy = 30;
        } else if (range === 'upcomingMonth') {
            // Group by week for month view
            groupBy = 7;
        } else if (range === '7days') {
            pointsToShow = Math.min(7, forecast.length);
        }

        const grouped = [];
        
        if (range === '7days') {
            // For 7-day view, show the next 7 days starting from the first forecast entry
            // Prophet generates forecasts starting from today, so we start from index 0
            for (let i = 0; i < Math.min(7, forecast.length); i++) {
                const dataPoint = forecast[i];
                const date = new Date(dataPoint.date);
                const dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short' });
                const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                
                grouped.push({
                    day: dayLabel,
                    date: dateLabel,
                    predicted: Math.round(dataPoint.yhat * 10) / 10
                });
            }
        } else if (range === 'upcomingMonth') {
            // For month view, show exactly 4 weeks
            const weeksToShow = 4;
            const daysToShow = Math.min(weeksToShow * 7, forecast.length);
            
            for (let i = 0; i < daysToShow; i += groupBy) {
                const slice = forecast.slice(i, i + groupBy);
                if (slice.length === 0) break;
                
                const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
                
                const date = new Date(slice[0].date);
                const weekNum = Math.floor(i / 7) + 1;
                const dayLabel = `Week ${weekNum}`;
                const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                
                grouped.push({
                    day: dayLabel,
                    date: dateLabel,
                    predicted: Math.round(avgYhat * 10) / 10
                });
            }
        } else {
            // For year and custom ranges
            if (range === 'upcomingYear') {
                // Group by actual calendar months to avoid duplicates
                const monthlyData = {};
                
                forecast.forEach(f => {
                    const date = new Date(f.date);
                    const monthKey = `${date.getFullYear()}-${date.getMonth()}`; // e.g., "2026-2" for March 2026
                    
                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = {
                            values: [],
                            firstDate: date
                        };
                    }
                    monthlyData[monthKey].values.push(f.yhat);
                });
                
                // Convert to array and sort by date
                Object.keys(monthlyData).sort().forEach(monthKey => {
                    const data = monthlyData[monthKey];
                    const avgYhat = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
                    const date = data.firstDate;
                    
                    grouped.push({
                        day: date.toLocaleDateString('en-GB', { month: 'short' }),
                        date: date.toLocaleDateString('en-GB', { year: 'numeric' }),
                        predicted: Math.round(avgYhat * 10) / 10
                    });
                });
            } else {
                // Intelligently group custom ranges based on their length
                if (range === 'custom') {
                    const totalDays = forecast.length;
                    if (totalDays <= 14) {
                        // Show daily for up to 2 weeks
                        groupBy = 1;
                    } else if (totalDays <= 60) {
                        // Group by week for up to ~2 months
                        groupBy = 7;
                    } else {
                        // Group by actual calendar months for longer ranges
                        const monthlyData = {};
                        
                        forecast.forEach(f => {
                            const date = new Date(f.date);
                            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                            
                            if (!monthlyData[monthKey]) {
                                monthlyData[monthKey] = {
                                    values: [],
                                    firstDate: date
                                };
                            }
                            monthlyData[monthKey].values.push(f.yhat);
                        });
                        
                        Object.keys(monthlyData).sort().forEach(monthKey => {
                            const data = monthlyData[monthKey];
                            const avgYhat = data.values.reduce((sum, v) => sum + v, 0) / data.values.length;
                            const date = data.firstDate;
                            
                            grouped.push({
                                day: date.toLocaleDateString('en-GB', { month: 'short' }),
                                date: date.toLocaleDateString('en-GB', { year: 'numeric' }),
                                predicted: Math.round(avgYhat * 10) / 10
                            });
                        });
                        
                        return grouped;
                    }
                }
            
                for (let i = 0; i < pointsToShow; i += groupBy) {
                    const slice = forecast.slice(i, i + groupBy);
                    const avgYhat = slice.reduce((sum, f) => sum + f.yhat, 0) / slice.length;
                    
                    const date = new Date(slice[0].date);
                    let dayLabel;
                    let dateLabel = '';
                    
                    if (range === 'custom' && groupBy === 7) {
                        // Custom range grouped by week
                        const weekNum = Math.floor(i / 7) + 1;
                        dayLabel = `Week ${weekNum}`;
                        dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    } else {
                        // Daily view for custom range or fallback
                        dayLabel = date.toLocaleDateString('en-GB', { weekday: 'short' });
                        dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }

                    grouped.push({
                        day: dayLabel,
                        date: dateLabel,
                        predicted: Math.round(avgYhat * 10) / 10
                    });
                }
            }
        }

        return grouped;
    };

    // Get the current forecast based on selected range
    const getCurrentForecast = () => {
        if (forecastRange === '7days') return forecast7Days;
        if (forecastRange === 'upcomingMonth') return forecastMonth;
        if (forecastRange === 'upcomingYear') return forecastYear;
        if (forecastRange === 'custom') return forecastCustom;
        return null;
    };

    // Helper to filter forecast data to start from today
    const filterForecastFromToday = (forecastData) => {
        if (!forecastData || !forecastData.forecast) return forecastData;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filteredForecast = forecastData.forecast.filter(f => {
            const forecastDate = new Date(f.date);
            forecastDate.setHours(0, 0, 0, 0);
            return forecastDate >= today;
        });
        
        return {
            ...forecastData,
            forecast: filteredForecast
        };
    };

    // Generate all forecasts at once (7 days + 1 month + 1 year from today)
    const generateAllForecasts = async () => {
        console.log('🔄 Generating new forecasts...');
        setIsLoading(true);
        setForecastError(null);
        
        // Clear existing forecasts to show regeneration is happening
        setForecast7Days(null);
        setForecastMonth(null);
        setForecastYear(null);

        try {
            // Calculate weeks from last data point (Oct 16, 2025) to today (March 3, 2026)
            // This is approximately 20 weeks. We need to forecast beyond today.
            const lastDataDate = new Date('2025-10-16');
            const today = new Date();
            const weeksFromLastData = Math.ceil((today - lastDataDate) / (7 * 24 * 60 * 60 * 1000));
            
            console.log(`📅 Last training data: Oct 16, 2025 (${weeksFromLastData} weeks ago)`);
            console.log(`📅 Today: ${today.toDateString()}`);
            
            // Backend limit is 52 weeks max, so cap all horizons
            // Fetch 7-day forecast (from last data point, enough to cover today + 1 week)
            const horizon7Days = Math.min(52, weeksFromLastData + 1);
            console.log(`📊 Fetching forecast for ${horizon7Days} weeks to cover today + 7 days...`);
            const response7Days = await fetch(`http://localhost:5001/api/prophet/test?horizon_weeks=${horizon7Days}&_t=${Date.now()}`);
            const data7Days = await response7Days.json();
            
            if (!response7Days.ok) {
                throw new Error(data7Days.message || 'Failed to load 7-day forecast');
            }
            console.log('✅ 7-day forecast received:', data7Days);
            
            // Fetch 1-month forecast (from last data point, enough to cover today + 4 weeks)
            const horizonMonth = Math.min(52, weeksFromLastData + 4);
            console.log(`📊 Fetching forecast for ${horizonMonth} weeks to cover today + 1 month...`);
            const responseMonth = await fetch(`http://localhost:5001/api/prophet/test?horizon_weeks=${horizonMonth}&_t=${Date.now()}`);
            const dataMonth = await responseMonth.json();
            
            if (!responseMonth.ok) {
                throw new Error(dataMonth.message || 'Failed to load month forecast');
            }
            console.log('✅ 1-month forecast received:', dataMonth);
            
            // Fetch maximum forecast (52 weeks from last data point)
            // Note: Due to data gap (~20 weeks), this will only cover ~32 weeks from today
            const horizonYear = 52; // Use max allowed
            console.log(`📊 Fetching forecast for ${horizonYear} weeks (max allowed)...`);
            const responseYear = await fetch(`http://localhost:5001/api/prophet/test?horizon_weeks=${horizonYear}&_t=${Date.now()}`);
            const dataYear = await responseYear.json();
            
            if (!responseYear.ok) {
                throw new Error(dataYear.message || 'Failed to load year forecast');
            }
            console.log('✅ Year forecast received:', dataYear);
            
            // Filter all forecasts to only include dates from today onwards
            setForecast7Days(filterForecastFromToday(data7Days));
            setForecastMonth(filterForecastFromToday(dataMonth));
            setForecastYear(filterForecastFromToday(dataYear));
            setHasGenerated(true);
            setLastGenerated(new Date());
            console.log('✨ Forecasts generated successfully at', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('❌ Forecast error:', error);
            setForecastError(error.message);
            setForecast7Days(null);
            setForecastMonth(null);
            setForecastYear(null);
            setHasGenerated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate custom range forecast
    const generateCustomForecast = async () => {
        if (!customStart || !customEnd) return;
        
        setIsLoading(true);
        setForecastError(null);

        try {
            // Calculate from last training data to custom end date
            const lastDataDate = new Date('2025-10-16');
            const customEndDate = new Date(customEnd);
            const customStartDate = new Date(customStart);
            
            // Calculate weeks needed from last data point to cover the custom end date
            const weeksToCustomEnd = Math.ceil((customEndDate - lastDataDate) / (7 * 24 * 60 * 60 * 1000));
            const horizon_weeks = Math.min(52, Math.max(1, weeksToCustomEnd));
            
            console.log(`📊 Custom forecast: ${customStart} to ${customEnd}`);
            console.log(`📊 Requesting ${horizon_weeks} weeks forecast (capped at 52)...`);
            
            const response = await fetch(`http://localhost:5001/api/prophet/test?horizon_weeks=${horizon_weeks}&_t=${Date.now()}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load custom forecast');
            }
            
            // Filter to only show the custom date range
            if (data && data.forecast) {
                const filteredForecast = data.forecast.filter(f => {
                    const forecastDate = new Date(f.date);
                    forecastDate.setHours(0, 0, 0, 0);
                    customStartDate.setHours(0, 0, 0, 0);
                    customEndDate.setHours(0, 0, 0, 0);
                    return forecastDate >= customStartDate && forecastDate <= customEndDate;
                });
                
                setForecastCustom({
                    ...data,
                    forecast: filteredForecast
                });
                console.log(`✅ Custom forecast filtered to ${filteredForecast.length} days`);
            } else {
                setForecastCustom(data);
            }
        } catch (error) {
            console.error('Custom forecast error:', error);
            setForecastError(error.message);
            setForecastCustom(null);
        } finally {
            setIsLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // TODO (Prophet integration): add a useEffect here that fetches from Flask:
    //
    //   GET /api/v1/forecast
    //     ?dataset_id=<id>        ← ID of the uploaded CSV dataset
    //     &item_id=<id>           ← ID of the menu item (coffee, croissant, etc.)
    //     &algorithm=prophet
    //     &train_weeks=6          ← weeks of history to train on
    //     &horizon_weeks=4        ← weeks ahead to predict
    //
    // Flask returns JSON shaped like:
    //   {
    //     "forecast": [
    //       { "date": "2026-03-01", "yhat": 42.5, "yhat_lower": 35, "yhat_upper": 50 },
    //       { "date": "2026-03-02", "yhat": 47.1, ... },
    //       ...
    //     ]
    //   }
    //
    // Map response into:  forecast.map(f => ({
    //   day: new Date(f.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    //   predicted: f.yhat,
    // }))
    // Then set isLoading(true) before the fetch and isLoading(false) after.
    // Delete MOCK_getChartData and SPARKLINE_* above once this is wired up.
    // -------------------------------------------------------------------------

    const currentForecast = getCurrentForecast();

    // Calculate total forecast value
    const totalForecast = currentForecast?.forecast
        ? currentForecast.forecast.reduce((sum, f) => sum + f.yhat, 0)
        : null;

    const getRangeLabel = () => {
        if (forecastRange === 'custom' && customStart && customEnd)
            return `${customStart} to ${customEnd}`;
        return FORECAST_RANGE_OPTIONS.find((o) => o.value === forecastRange)?.label || 'Next 7 days';
    };

    // Get chart data directly (no animation)
    const chartData = currentForecast?.forecast 
        ? transformProphetData(currentForecast.forecast, forecastRange) 
        : [];

    // Graph metadata - using real Prophet data only
    const graphs = {
        graph1: {
            title: currentForecast ? `${currentForecast.item_name} Forecast` : 'Generate forecast to view predictions',
            value: totalForecast ? `${Math.round(totalForecast)} units` : 'N/A',
            change: currentForecast ? `${currentForecast.horizon_weeks}w forecast` : 'N/A',
            isPositive: true,
            icon: '☕',
            color: 'from-stone-100 to-stone-200',
            data: chartData,
        },
    };

    const quickStats = currentForecast ? [
        { 
            label: 'Total Forecast', 
            value: `${Math.round(totalForecast)} units`,
            change: `${currentForecast.horizon_weeks}w`,
            positive: true,  
            icon: FaChartLine,   
            spark: currentForecast.forecast.slice(0, 7).map(f => ({ v: f.yhat }))
        },
        { 
            label: 'Training Data',
            value: `${currentForecast.training_data_points} days`,
            change: `${currentForecast.train_weeks}w`,
            positive: null,
            icon: FaCheckDouble,
            spark: currentForecast.forecast.slice(0, 7).map(f => ({ v: f.yhat }))
        },
        {
            label: 'Item',
            value: currentForecast.item_name,
            change: 'Prophet',
            positive: null,
            icon: FaPoundSign,
            spark: currentForecast.forecast.slice(0, 7).map(f => ({ v: f.yhat }))
        },
        {
            label: 'Predictions',
            value: `${currentForecast.forecast.length}`,
            change: 'days',
            positive: null,
            icon: FaShoppingBag,
            spark: currentForecast.forecast.slice(0, 7).map(f => ({ v: f.yhat }))
        },
    ] : [];

    const getLastUpdatedText = () => {
        if (!lastGenerated) {
            return 'No forecast generated yet';
        }
        const formatted = lastGenerated.toLocaleTimeString('en-GB', {
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        return `Forecast generated at ${formatted}`;
    };

    if (isLoading) {
        return (
            <div className="ml-0 md:ml-64 flex-1 min-w-0 min-h-screen bg-dashboard-gradient p-4 md:p-8">
                <div className="h-5 w-32 bg-pinkcafe2/10 rounded animate-pulse mb-6 mt-16 md:mt-0" />
                <div className="mb-10">
                    <div className="h-10 w-64 bg-pinkcafe2/20 rounded animate-pulse mb-2" />
                    <div className="h-5 w-96 bg-pinkcafe2/10 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
                    {[1,2,3,4].map((i) => (
                        <div key={i} className="bg-white/80 rounded-xl p-4 h-24 animate-pulse">
                            <div className="h-3 w-20 bg-pinkcafe2/10 rounded mb-2" />
                            <div className="h-8 w-24 bg-pinkcafe2/20 rounded" />
                        </div>
                    ))}
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 bg-white/80 rounded-2xl h-[380px] animate-pulse" />
                    <div className="w-full lg:w-80 space-y-4">
                        {[1,2,3].map((i) => <div key={i} className="bg-white/80 rounded-xl h-32 animate-pulse" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-0 md:ml-64 flex-1 min-w-0 min-h-screen bg-dashboard-gradient p-4 md:p-8 transition-all duration-300">
            {/* Breadcrumb */}
            <nav className="mb-6 mt-16 md:mt-0 flex items-center gap-2 text-sm text-pinkcafe2/60">
                <Link to="/home" className="hover:text-pinkcafe2 transition-colors flex items-center gap-1">
                    <FaHome className="text-xs" /> Home
                </Link>
                <span>/</span>
                <span className="text-pinkcafe2 font-medium">Dashboard</span>
            </nav>

            {/* Header */}
            <div className="mb-10">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-black mb-2 tracking-tight">
                    Sales Forecasting
                </h1>
                <p className="text-black/80 text-base max-w-xl mb-2">
                    AI-powered product demand predictions to reduce waste and optimize inventory
                </p>
                <div className="flex items-center gap-4">
                    <p className="text-xs text-black/60">{getLastUpdatedText()}</p>
                    {hasGenerated && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                {quickStats.length > 0 ? (
                    quickStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-pinkcafe2/15 hover:border-pinkcafe2/25">
                                <div className="bg-pinkcafe2 px-4 py-3 flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Icon className="text-white text-sm" />
                                    </div>
                                    {stat.change && (
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            stat.positive === true  ? 'bg-emerald-700 text-emerald-100' :
                                            stat.positive === false ? 'bg-rose-700 text-rose-100' :
                                                                      'bg-stone-600 text-stone-200'
                                        }`}>
                                            {stat.change}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-white px-4 py-4 md:py-5">
                                    <p className="text-sm md:text-base text-pinkcafe2/70 font-semibold mb-1">{stat.label}</p>
                                    <p className="text-xl md:text-2xl font-bold text-pinkcafe2 font-display mb-2">{stat.value}</p>
                                    <div className="h-8 -mx-1 opacity-70">
                                        <Sparkline
                                            data={stat.spark}
                                            color={stat.positive === true ? '#10b981' : stat.positive === false ? '#f43f5e' : '#423b39'}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    /* Placeholder cards when no forecast generated */
                    <>
                        {[
                            { icon: FaChartLine, label: 'Total Forecast' },
                            { icon: FaCheckDouble, label: 'Training Data' },
                            { icon: FaPoundSign, label: 'Item' },
                            { icon: FaShoppingBag, label: 'Predictions' }
                        ].map((placeholder, i) => {
                            const Icon = placeholder.icon;
                            return (
                                <div key={i} className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 opacity-50">
                                    <div className="bg-pinkcafe2/50 px-4 py-3 flex items-center justify-between">
                                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                            <Icon className="text-white text-sm" />
                                        </div>
                                    </div>
                                    <div className="bg-white px-4 py-4 md:py-5">
                                        <p className="text-sm md:text-base text-pinkcafe2/70 font-semibold mb-1">{placeholder.label}</p>
                                        <p className="text-xl md:text-2xl font-bold text-pinkcafe2/40 font-display mb-2">—</p>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Main content */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-stretch w-full">
                {/* Main Chart Card */}
                <div className="flex-1 min-w-0 flex">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-white/80 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-pinkcafe2/10 hover:-translate-y-1 flex-1 flex flex-col min-h-0 w-full">
                        <div className="bg-pinkcafe2 px-6 py-5 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{graphs.graph1.icon}</span>
                                <h2 className="font-display text-xl md:text-2xl font-bold text-white">{graphs.graph1.title}</h2>
                            </div>
                            <p className="text-white/80 text-sm mb-1">{getRangeLabel()}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl md:text-4xl font-bold text-white font-display">{graphs.graph1.value}</span>
                                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-emerald-700 text-emerald-100">
                                    {graphs.graph1.change}
                                </span>
                            </div>
                            {/* Range buttons */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {FORECAST_RANGE_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                                    <button 
                                        key={opt.value} 
                                        type="button" 
                                        onClick={() => setForecastRange(opt.value)}
                                        disabled={!hasGenerated}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            forecastRange === opt.value ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                                        }`}>
                                        {opt.label}
                                    </button>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => setForecastRange('custom')}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        forecastRange === 'custom' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                                    }`}>
                                    Custom
                                </button>
                            </div>
                            {forecastRange === 'custom' && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <input 
                                        type="date" 
                                        value={customStart} 
                                        min={new Date().toISOString().split('T')[0]}
                                        max="2026-10-09"
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <span className="text-white/80 text-xs">to</span>
                                    <input 
                                        type="date" 
                                        value={customEnd} 
                                        min={customStart || new Date().toISOString().split('T')[0]} 
                                        max="2026-10-09"
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <button 
                                        type="button" 
                                        onClick={generateCustomForecast}
                                        disabled={isLoading || !customStart || !customEnd}
                                        className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all bg-white text-pinkcafe2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed ml-auto">
                                        {isLoading ? 'Loading...' : 'Generate Custom'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={`bg-gradient-to-br ${graphs.graph1.color} flex-1 min-h-[280px] p-4 md:p-6 flex flex-col transition-all duration-500`}>
                            <SimpleLineChart data={graphs.graph1.data} dataKey="predicted" />
                        </div>
                    </div>
                </div>

                {/* Side Cards */}
                <div className="w-full lg:w-64 xl:w-72 flex flex-col gap-3 flex-shrink-0">
                    {currentForecast && (
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm border-2 border-pinkcafe2 ring-2 ring-pinkcafe2 ring-offset-2">
                            <div className="flex">
                                <div className="w-1 flex-shrink-0 bg-pinkcafe2" />
                                <div className="flex-1 min-w-0 p-3">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="text-lg">{graphs.graph1.icon}</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-emerald-700 text-emerald-100">
                                            {graphs.graph1.change}
                                        </span>
                                    </div>
                                    <h3 className="font-display font-bold text-pinkcafe2 text-sm leading-tight mb-0.5">{graphs.graph1.title}</h3>
                                    <p className="text-[10px] text-pinkcafe2/50 mb-2">{getRangeLabel()}</p>
                                    <p className="text-base font-bold text-pinkcafe2 font-display mb-2">{graphs.graph1.value}</p>
                                    <div className="h-7 -mx-1 opacity-60">
                                        <Sparkline data={graphs.graph1.data.map(d => ({ v: d.predicted }))} color="#10b981" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Insights Panel (xl only) */}
                <div className="hidden xl:flex flex-col gap-4 w-64 xl:w-72 flex-shrink-0">
                    {/* Generate/Regenerate Button */}
                    <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
                        <h3 className="font-display font-bold text-pinkcafe2 text-sm mb-3">Forecast Control</h3>
                        <button
                            onClick={generateAllForecasts}
                            disabled={isLoading}
                            className="w-full bg-pinkcafe2 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-pinkcafe2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
                            {isLoading ? 'Generating...' : (hasGenerated ? 'Regenerate Forecast' : 'Generate Forecast')}
                        </button>
                        <p className="text-xs text-pinkcafe2/60 mt-2 text-center">
                            {hasGenerated ? 'Update predictions' : 'Generate forecasts from today'}
                        </p>
                    </div>

                    {/* Insights */}
                    <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
                        <h3 className="font-display font-bold text-pinkcafe2 text-sm mb-3">Insights</h3>
                        {currentForecast ? (
                            <ul className="space-y-2 text-xs text-pinkcafe2/80">
                                <li className="flex gap-2"><span className="text-emerald-600">●</span>Forecast generated successfully</li>
                                <li className="flex gap-2"><span className="text-emerald-600">●</span>{currentForecast.item_name} - predictions from today</li>
                                <li className="flex gap-2"><span className="text-amber-600">●</span>Training data: Mar-Oct 2025</li>
                                <li className="flex gap-2"><span className="text-amber-600">●</span>Long-term view: ~7 months (to Oct 2026)</li>
                                <li className="flex gap-2"><span className="text-blue-600">●</span>Predictions extrapolated from old data</li>
                            </ul>
                        ) : (
                            <div className="text-center py-6">
                                <FaChartLine className="text-pinkcafe2/20 text-3xl mx-auto mb-2" />
                                <p className="text-xs text-pinkcafe2/60">Generate forecast to view insights</p>
                            </div>
                        )}
                    </div>

                    {/* Model Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
                        <h3 className="font-display font-bold text-pinkcafe2 text-sm mb-2">Model</h3>
                        <p className="text-xs text-pinkcafe2/60">
                            {currentForecast 
                                ? `Prophet forecasting • ${currentForecast.forecast.length} predictions`
                                : 'Prophet forecasting • Awaiting data'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPagePanel;