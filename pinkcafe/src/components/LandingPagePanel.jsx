import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { FaPoundSign, FaChartLine, FaShoppingBag, FaCheckDouble, FaHome } from 'react-icons/fa';

// Mock forecast data generators
const getChartData = (range, customStart, customEnd) => {
    if (range === '7days') {
        return [
            { day: 'Mon', units: 38, predicted: 42 },
            { day: 'Tue', units: 45, predicted: 48 },
            { day: 'Wed', units: 52, predicted: 51 },
            { day: 'Thu', units: 48, predicted: 49 },
            { day: 'Fri', units: 61, predicted: 58 },
            { day: 'Sat', units: 72, predicted: 68 },
            { day: 'Sun', units: 55, predicted: 56 },
        ];
    }
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
    return [
        { day: 'Mon', units: 38, predicted: 42 },
        { day: 'Tue', units: 45, predicted: 48 },
        { day: 'Wed', units: 52, predicted: 51 },
        { day: 'Thu', units: 48, predicted: 49 },
        { day: 'Fri', units: 61, predicted: 58 },
        { day: 'Sat', units: 72, predicted: 68 },
        { day: 'Sun', units: 55, predicted: 56 },
    ];
};

const FORECAST_RANGE_OPTIONS = [
    { value: '7days', label: 'Next 7 days' },
    { value: 'upcomingMonth', label: 'Upcoming month' },
    { value: 'custom', label: 'Custom dates' },
];

// Sparkline data for stat cards
const SPARKLINE_DATA = [
    { v: 2 }, { v: 3 }, { v: 2.5 }, { v: 4 }, { v: 3.5 }, { v: 5 }, { v: 4.5 },
];
const SPARKLINE_DOWN = [{ v: 5 }, { v: 4 }, { v: 3.5 }, { v: 3 }, { v: 2.5 }, { v: 2 }, { v: 1.5 }];

function LandingPagePanel() {
    const [mainGraph, setMainGraph] = useState('graph1');
    const [isLoading, setIsLoading] = useState(true);
    const [hasData] = useState(true);
    const [forecastRange, setForecastRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(t);
    }, []);

    const baseChartData = getChartData(forecastRange, customStart, customEnd);

    const getRangeLabel = () => {
        if (forecastRange === 'custom' && customStart && customEnd) {
            return `${customStart} to ${customEnd}`;
        }
        return FORECAST_RANGE_OPTIONS.find((o) => o.value === forecastRange)?.label || 'Next 7 days';
    };

    const graphs = {
        graph1: {
            title: 'Coffee Sales Forecast',
            value: forecastRange === 'upcomingMonth' ? '5,400 units' : '342 units',
            change: '+15.3%',
            isPositive: true,
            icon: '☕',
            color: 'from-stone-100 to-stone-200',
            data: baseChartData,
        },
        graph2: {
            title: 'Pastry Demand Prediction',
            value: forecastRange === 'upcomingMonth' ? '8,200 units' : '567 units',
            change: '+8.7%',
            isPositive: true,
            icon: '🥐',
            color: 'from-slate-100 to-slate-200',
            data: baseChartData.map((d, i) => ({ ...d, predicted: (d.predicted || 0) + i * 80 })),
        },
        graph3: {
            title: 'Sandwich Sales Trend',
            value: forecastRange === 'upcomingMonth' ? '3,100 units' : '289 units',
            change: '-5.2%',
            isPositive: false,
            icon: '🥪',
            color: 'from-zinc-100 to-zinc-200',
            data: baseChartData.map((d, i) => ({
                ...d,
                predicted: Math.max(0, (d.predicted || 0) - i * 30),
            })),
        },
    };

    const quickStats = [
        { label: "Today's Sales", value: '£2,340', change: '+12.4%', positive: true, icon: FaPoundSign, spark: SPARKLINE_DATA },
        { label: 'Weekly Forecast', value: '£14,200', change: '+8.2%', positive: true, icon: FaChartLine, spark: SPARKLINE_DATA },
        { label: 'Top Items', value: '12', change: '-4.1%', positive: false, icon: FaShoppingBag, spark: SPARKLINE_DOWN },
        { label: 'Model Accuracy', value: '94%', change: 'MAE', positive: null, icon: FaCheckDouble, spark: SPARKLINE_DATA },
    ];

    const lastUpdated = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    if (isLoading) {
        return (
            <div className="ml-0 md:ml-64 min-h-screen bg-[linear-gradient(to_bottom,#f5dce0_0%,#efd2d6_12%,#e8c8cc_25%,#e0bcc0_38%,#d8b0b4_50%,#d0a4a8_62%,#c9989c_75%,#c18c90_88%,#b98084_100%)] p-4 md:p-8">
                <div className="h-5 w-32 bg-pinkcafe2/10 rounded animate-pulse mb-6 mt-16 md:mt-0" />
                <div className="mb-10">
                    <div className="h-4 w-24 bg-pinkcafe2/20 rounded animate-pulse mb-2" />
                    <div className="h-10 w-64 bg-pinkcafe2/20 rounded animate-pulse mb-2" />
                    <div className="h-5 w-96 bg-pinkcafe2/10 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/80 rounded-xl p-4 h-24 animate-pulse">
                            <div className="h-3 w-20 bg-pinkcafe2/10 rounded mb-2" />
                            <div className="h-8 w-24 bg-pinkcafe2/20 rounded" />
                        </div>
                    ))}
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 bg-white/80 rounded-2xl h-[380px] animate-pulse" />
                    <div className="w-full lg:w-80 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/80 rounded-xl h-32 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="ml-0 md:ml-64 min-h-screen bg-[linear-gradient(to_bottom,#f5dce0_0%,#efd2d6_12%,#e8c8cc_25%,#e0bcc0_38%,#d8b0b4_50%,#d0a4a8_62%,#c9989c_75%,#c18c90_88%,#b98084_100%)] p-4 md:p-8 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pinkcafe2/10 flex items-center justify-center">
                        <FaChartLine className="text-4xl text-pinkcafe2/50" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-pinkcafe2 mb-2">No data yet</h2>
                    <p className="text-pinkcafe2/70 mb-6">
                        Upload a CSV or connect your sales data to see forecasts here.
                    </p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-pinkcafe2 text-white font-medium rounded-lg hover:bg-pinkcafe2/90 transition-colors"
                    >
                        Upload data
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="ml-0 md:ml-64 min-h-screen bg-[linear-gradient(to_bottom,#f5dce0_0%,#efd2d6_12%,#e8c8cc_25%,#e0bcc0_38%,#d8b0b4_50%,#d0a4a8_62%,#c9989c_75%,#c18c90_88%,#b98084_100%)] p-4 md:p-8 transition-all duration-300">
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
                <p className="text-xs text-black/60">
                    Last updated: {lastUpdated}
                </p>
            </div>

            {/* Quick Stats with icons and sparklines */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                {quickStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="bg-pinkcafe2 px-4 py-3 flex items-center justify-between">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Icon className="text-white text-sm" />
                                </div>
                                {stat.change && (
                                    <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                            stat.positive === true
                                                ? 'bg-emerald-700 text-emerald-100'
                                                : stat.positive === false
                                                ? 'bg-rose-700 text-rose-100'
                                                : 'bg-stone-600 text-stone-200'
                                        }`}
                                    >
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <div className="bg-white px-4 py-4 md:py-5">
                                <p className="text-sm md:text-base text-pinkcafe2/70 font-semibold mb-1">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-bold text-pinkcafe2 font-display mb-2">
                                    {stat.value}
                                </p>
                                <div className="h-8 -mx-1 opacity-70">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stat.spark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <Area
                                            type="monotone"
                                            dataKey="v"
                                            stroke="none"
                                            fill={
                                                stat.positive === true
                                                    ? '#10b981'
                                                    : stat.positive === false
                                                    ? '#f43f5e'
                                                    : '#423b39'
                                            }
                                            fillOpacity={stat.positive !== null ? 0.4 : 0.25}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content - main card height matches three side cards */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-stretch">
                {/* Main Chart Card */}
                <div className="flex-1 min-w-0 flex">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-white/80 transition-shadow duration-300 hover:shadow-xl flex-1 flex flex-col min-h-0 w-full">
                        <div className="bg-pinkcafe2 px-6 py-5 flex-shrink-0 min-h-[140px]">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{graphs[mainGraph].icon}</span>
                                    <h2 className="font-display text-xl md:text-2xl font-bold text-white">
                                        {graphs[mainGraph].title}
                                    </h2>
                                </div>
                                <p className="text-white/80 text-sm">
                                    {getRangeLabel()}
                                </p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl md:text-4xl font-bold text-white font-display">
                                        {graphs[mainGraph].value}
                                    </span>
                                    <span
                                        className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                            graphs[mainGraph].isPositive
                                                ? 'bg-emerald-700 text-emerald-100'
                                                : 'bg-rose-700 text-rose-100'
                                        }`}
                                    >
                                        {graphs[mainGraph].change}
                                    </span>
                                </div>
                            </div>
                            {/* Forecast period mini buttons - fixed height row */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {FORECAST_RANGE_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setForecastRange(opt.value)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                            forecastRange === opt.value
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white/10 text-white/80 hover:bg-white/15'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setForecastRange('custom')}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                        forecastRange === 'custom'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/10 text-white/80 hover:bg-white/15'
                                    }`}
                                >
                                    Custom
                                </button>
                            </div>
                            {forecastRange === 'custom' && (
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    <span className="text-white/80 text-xs">to</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        min={customStart}
                                        className="rounded bg-white/95 border-0 px-2 py-1 text-xs text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                </div>
                            )}
                        </div>
                        <div
                            className={`bg-gradient-to-br ${graphs[mainGraph].color} flex-1 min-h-[280px] p-4 md:p-6 transition-all duration-500 flex flex-col`}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={graphs[mainGraph].data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#423b3950" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#423b3950" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e7c6ce' }}
                                        formatter={(value) => [value, 'Units']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        stroke="#423b39"
                                        strokeWidth={2}
                                        dot={{ fill: '#423b39', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Side Cards */}
                <div className="w-full lg:w-56 flex flex-col gap-3">
                    {Object.keys(graphs).map((key) => {
                        const graph = graphs[key];
                        const sparkData = graph.data.map((d) => ({ v: d.predicted ?? d.units ?? 0 }));
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setMainGraph(key)}
                                className={`group text-left bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
                                    mainGraph === key
                                        ? 'ring-2 ring-pinkcafe2 ring-offset-2 shadow-xl scale-[1.02]'
                                        : 'hover:shadow-lg hover:scale-[1.01]'
                                }`}
                            >
                                <div className="flex">
                                    <div
                                        className={`w-1 flex-shrink-0 ${
                                            mainGraph === key ? 'bg-pinkcafe2' : 'bg-stone-200 group-hover:bg-pinkcafe2/40'
                                        }`}
                                    />
                                    <div className="flex-1 min-w-0 p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-lg">{graph.icon}</span>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                                    graph.isPositive
                                                        ? 'bg-emerald-700 text-emerald-100'
                                                        : 'bg-rose-700 text-rose-100'
                                                }`}
                                            >
                                                {graph.change}
                                            </span>
                                        </div>
                                        <h3 className="font-display font-bold text-pinkcafe2 text-sm leading-tight mb-0.5">
                                            {graph.title}
                                        </h3>
                                        <p className="text-[10px] text-pinkcafe2/50 mb-2">{getRangeLabel()}</p>
                                        <p className="text-base font-bold text-pinkcafe2 font-display mb-2">
                                            {graph.value}
                                        </p>
                                        <div className="h-7 -mx-1 opacity-60">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                    <Area
                                                        type="monotone"
                                                        dataKey="v"
                                                        stroke="none"
                                                        fill={
                                                            graph.isPositive
                                                                ? '#10b981'
                                                                : '#f43f5e'
                                                        }
                                                        fillOpacity={0.35}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default LandingPagePanel;
