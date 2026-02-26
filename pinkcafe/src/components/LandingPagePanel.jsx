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
    const pad = { top: 10, right: 10, bottom: 28, left: 32 };
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
    // X-axis labels
    const xLabels = data.map((d) => d.day);

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
            {/* X labels */}
            {xLabels.map((label, i) => (
                <text key={i} x={px(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="#423b3980">
                    {label}
                </text>
            ))}
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------
// ⚠️  MOCK DATA — REMOVE THIS ENTIRE FUNCTION WHEN PROPHET IS INTEGRATED
//
// Replace with real data fetched from Flask (see TODO block inside the
// component below). The chart expects an array of objects shaped like:
//   { day: "Mon", predicted: 42 }
// where `predicted` is the yhat value returned by Prophet.
// ---------------------------------------------------------------------------
const MOCK_getChartData = (range, customStart, customEnd) => {
    if (range === 'upcomingMonth') {
        return [
            { day: 'Week 1', predicted: 1250 },
            { day: 'Week 2', predicted: 1380 },
            { day: 'Week 3', predicted: 1420 },
            { day: 'Week 4', predicted: 1350 },
        ];
    }
    if (range === 'custom' && customStart && customEnd) {
        const days = Math.ceil((new Date(customEnd) - new Date(customStart)) / (1000 * 60 * 60 * 24));
        const points = Math.min(Math.max(Math.ceil(days / 7), 4), 12);
        return Array.from({ length: points }, (_, i) => ({
            day: `Day ${i * Math.ceil(days / points) + 1}`,
            predicted: 40 + Math.sin(i * 0.5) * 15 + i * 2,
        }));
    }
    // ⚠️ Default 7-day mock — replace with Prophet forecast data
    return [
        { day: 'Mon', predicted: 42 },
        { day: 'Tue', predicted: 48 },
        { day: 'Wed', predicted: 51 },
        { day: 'Thu', predicted: 49 },
        { day: 'Fri', predicted: 58 },
        { day: 'Sat', predicted: 68 },
        { day: 'Sun', predicted: 56 },
    ];
};

const FORECAST_RANGE_OPTIONS = [
    { value: '7days', label: 'Next 7 days' },
    { value: 'upcomingMonth', label: 'Upcoming month' },
    { value: 'custom', label: 'Custom dates' },
];

// ⚠️ MOCK sparkline data — replace with a rolling window of real daily totals
const SPARKLINE_DATA = [{ v: 2 }, { v: 3 }, { v: 2.5 }, { v: 4 }, { v: 3.5 }, { v: 5 }, { v: 4.5 }];
const SPARKLINE_DOWN = [{ v: 5 }, { v: 4 }, { v: 3.5 }, { v: 3 }, { v: 2.5 }, { v: 2 }, { v: 1.5 }];

function LandingPagePanel() {
    const [mainGraph, setMainGraph] = useState('graph1');
    const [isLoading] = useState(false);
    const [hasData] = useState(true);
    const [forecastRange, setForecastRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [animatedData, setAnimatedData] = useState(null);
    const animRef = useRef(null);
    const prevDataRef = useRef(null);

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

    // ⚠️ MOCK — swap MOCK_getChartData for real API state once Prophet is integrated
    const baseChartData = MOCK_getChartData(forecastRange, customStart, customEnd);

    const getRangeLabel = () => {
        if (forecastRange === 'custom' && customStart && customEnd)
            return `${customStart} to ${customEnd}`;
        return FORECAST_RANGE_OPTIONS.find((o) => o.value === forecastRange)?.label || 'Next 7 days';
    };

    // -------------------------------------------------------------------------
    // ⚠️ MOCK graph metadata — replace hardcoded `value` and `change` with
    // values computed from the Prophet forecast response, e.g.:
    //   value: `${forecast.reduce((s, f) => s + f.yhat, 0).toFixed(0)} units`
    //   change: compare forecast total vs previous period
    // The `data` array is what actually drives the chart — that's the main thing
    // to replace with real Prophet output.
    // -------------------------------------------------------------------------
    const graphs = {
        graph1: {
            title: 'Coffee Sales Forecast',
            value: forecastRange === 'upcomingMonth' ? '5,400 units' : '342 units', // ⚠️ MOCK
            change: '+15.3%',      // ⚠️ MOCK
            isPositive: true,      // ⚠️ MOCK
            icon: '☕',
            color: 'from-stone-100 to-stone-200',
            data: baseChartData,   // ⚠️ MOCK — replace with Prophet forecast data
        },
        graph2: {
            title: 'Pastry Demand Prediction',
            value: forecastRange === 'upcomingMonth' ? '8,200 units' : '567 units', // ⚠️ MOCK
            change: '+8.7%',       // ⚠️ MOCK
            isPositive: true,      // ⚠️ MOCK
            icon: '🥐',
            color: 'from-slate-100 to-slate-200',
            data: baseChartData.map((d, i) => ({ ...d, predicted: (d.predicted || 0) + i * 80 })), // ⚠️ MOCK
        },
        graph3: {
            title: 'Sandwich Sales Trend',
            value: forecastRange === 'upcomingMonth' ? '3,100 units' : '289 units', // ⚠️ MOCK
            change: '-5.2%',       // ⚠️ MOCK
            isPositive: false,     // ⚠️ MOCK
            icon: '🥪',
            color: 'from-zinc-100 to-zinc-200',
            data: baseChartData.map((d, i) => ({ ...d, predicted: Math.max(0, (d.predicted || 0) - i * 30) })), // ⚠️ MOCK
        },
    };

    // -----------------------------------------------------------------------
    // Smooth line animation when switching graphs
    // Interpolates Y values from the previous graph's data to the new one
    // using requestAnimationFrame + cubic ease-in-out (~400 ms).
    // -----------------------------------------------------------------------
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        const newData = graphs[mainGraph].data;
        const oldData = prevDataRef.current || newData;

        if (animRef.current) cancelAnimationFrame(animRef.current);

        const DURATION = 420;
        const startTime = performance.now();

        function step(now) {
            const raw = Math.min((now - startTime) / DURATION, 1);
            // Cubic ease-in-out
            const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;

            const len = Math.max(oldData.length, newData.length);
            const interpolated = Array.from({ length: len }, (_, i) => {
                const from = (oldData[Math.min(i, oldData.length - 1)]?.predicted) ?? 0;
                const to   = (newData[Math.min(i, newData.length - 1)]?.predicted) ?? 0;
                return {
                    ...(newData[Math.min(i, newData.length - 1)] || {}),
                    predicted: from + (to - from) * t,
                };
            });

            setAnimatedData(interpolated);

            if (raw < 1) {
                animRef.current = requestAnimationFrame(step);
            } else {
                setAnimatedData(newData);
                prevDataRef.current = newData;
                animRef.current = null;
            }
        }

        animRef.current = requestAnimationFrame(step);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // We only want this to fire when mainGraph or the base data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainGraph, forecastRange, customStart, customEnd]);

    // ⚠️ MOCK stat card values — replace with real aggregates from the API
    const quickStats = [
        { label: "Today's Sales",   value: '£2,340',  change: '+12.4%', positive: true,  icon: FaPoundSign,   spark: SPARKLINE_DATA }, // ⚠️ MOCK
        { label: 'Weekly Forecast', value: '£14,200', change: '+8.2%',  positive: true,  icon: FaChartLine,   spark: SPARKLINE_DATA }, // ⚠️ MOCK
        { label: 'Top Items',       value: '12',      change: '-4.1%',  positive: false, icon: FaShoppingBag, spark: SPARKLINE_DOWN }, // ⚠️ MOCK
        { label: 'Model Accuracy',  value: '94%',     change: 'MAE',    positive: null,  icon: FaCheckDouble, spark: SPARKLINE_DATA }, // ⚠️ MOCK — pull from forecast metadata
    ];

    const lastUpdated = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

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

    if (!hasData) {
        return (
            <div className="ml-0 md:ml-64 flex-1 min-w-0 min-h-screen bg-dashboard-gradient p-4 md:p-8 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pinkcafe2/10 flex items-center justify-center">
                        <FaChartLine className="text-4xl text-pinkcafe2/50" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-pinkcafe2 mb-2">No data yet</h2>
                    <p className="text-pinkcafe2/70 mb-6">Upload a CSV or connect your sales data to see forecasts here.</p>
                    <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-pinkcafe2 text-white font-medium rounded-lg hover:bg-pinkcafe2/90 transition-colors">
                        Upload data
                    </Link>
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
                <p className="text-xs text-black/60">Last updated: {lastUpdated}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                {quickStats.map((stat, i) => {
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
                })}
            </div>

            {/* Main content */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-stretch w-full">
                {/* Main Chart Card */}
                <div className="flex-1 min-w-0 flex">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-white/80 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-pinkcafe2/10 hover:-translate-y-1 flex-1 flex flex-col min-h-0 w-full">
                        <div className="bg-pinkcafe2 px-6 py-5 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{graphs[mainGraph].icon}</span>
                                <h2 className="font-display text-xl md:text-2xl font-bold text-white">{graphs[mainGraph].title}</h2>
                            </div>
                            <p className="text-white/80 text-sm mb-1">{getRangeLabel()}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-3xl md:text-4xl font-bold text-white font-display">{graphs[mainGraph].value}</span>
                                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                    graphs[mainGraph].isPositive ? 'bg-emerald-700 text-emerald-100' : 'bg-rose-700 text-rose-100'
                                }`}>
                                    {graphs[mainGraph].change}
                                </span>
                            </div>
                            {/* Range buttons */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {FORECAST_RANGE_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                                    <button key={opt.value} type="button" onClick={() => setForecastRange(opt.value)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
                            </div>
                            {forecastRange === 'custom' && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50" />
                                    <span className="text-white/80 text-xs">to</span>
                                    <input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50" />
                                </div>
                            )}
                        </div>
                        <div className={`bg-gradient-to-br ${graphs[mainGraph].color} flex-1 min-h-[280px] p-4 md:p-6 flex flex-col transition-all duration-500`}>
                            <SimpleLineChart data={animatedData || graphs[mainGraph].data} dataKey="predicted" />
                        </div>
                    </div>
                </div>

                {/* Side Cards */}
                <div className="w-full lg:w-64 xl:w-72 flex flex-col gap-3 flex-shrink-0">
                    {Object.keys(graphs).map((key) => {
                        const graph = graphs[key];
                        const sparkData = graph.data.map((d) => ({ v: d.predicted ?? d.units ?? 0 }));
                        return (
                            <button key={key} type="button" onClick={() => setMainGraph(key)}
                                className={`group text-left bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-out ${
                                    mainGraph === key
                                        ? 'ring-2 ring-pinkcafe2 ring-offset-2 shadow-xl scale-[1.02]'
                                        : 'hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1'
                                }`}>
                                <div className="flex">
                                    <div className={`w-1 flex-shrink-0 ${mainGraph === key ? 'bg-pinkcafe2' : 'bg-stone-200 group-hover:bg-pinkcafe2/40'}`} />
                                    <div className="flex-1 min-w-0 p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-lg">{graph.icon}</span>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                graph.isPositive ? 'bg-emerald-700 text-emerald-100' : 'bg-rose-700 text-rose-100'
                                            }`}>
                                                {graph.change}
                                            </span>
                                        </div>
                                        <h3 className="font-display font-bold text-pinkcafe2 text-sm leading-tight mb-0.5">{graph.title}</h3>
                                        <p className="text-[10px] text-pinkcafe2/50 mb-2">{getRangeLabel()}</p>
                                        <p className="text-base font-bold text-pinkcafe2 font-display mb-2">{graph.value}</p>
                                        <div className="h-7 -mx-1 opacity-60">
                                            <Sparkline data={sparkData} color={graph.isPositive ? '#10b981' : '#f43f5e'} />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Insights Panel (xl only) */}
                <div className="hidden xl:flex flex-col gap-4 w-64 xl:w-72 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 flex-1 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
                        <h3 className="font-display font-bold text-pinkcafe2 text-sm mb-3">Insights</h3>
                        <ul className="space-y-2 text-sm text-pinkcafe2/80">
                            <li className="flex gap-2"><span className="text-emerald-600">●</span>Coffee demand peaks Thu–Sat</li>
                            <li className="flex gap-2"><span className="text-emerald-600">●</span>Pastry sales up 8.7% vs last week</li>
                            <li className="flex gap-2"><span className="text-rose-600">●</span>Sandwich trend down; review menu</li>
                        </ul>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
                        <h3 className="font-display font-bold text-pinkcafe2 text-sm mb-2">Model</h3>
                        <p className="text-xs text-pinkcafe2/60">Prophet forecasting • MAE 94%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPagePanel;