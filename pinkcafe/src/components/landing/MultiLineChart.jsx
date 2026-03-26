import React, { useState, useRef, useEffect } from 'react';
import { catmullRomPath, CHART_COLORS } from '../../utils/chartUtils';

function LineAnimated({ d, color, delay }) {
    const ref = useRef(null);
    const [len, setLen] = useState(0);
    useEffect(() => {
        if (ref.current) setLen(ref.current.getTotalLength());
    }, [d]);
    return (
        <path ref={ref} d={d} fill="none" stroke={color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{
                strokeDasharray: len || 1000,
                strokeDashoffset: len || 1000,
                '--path-length': len || 1000,
                animation: len ? `drawLine 0.5s ease-out ${delay}s forwards` : 'none',
            }} />
    );
}

function MultiLineChart({ dataByProduct, dataKey = 'predicted', animationTrigger = '' }) {
    const [tooltip, setTooltip] = useState(null);
    const [animKey, setAnimKey] = useState(0);
    const svgRef = useRef(null);

    // Trigger re-animation when either chart values or selected period changes
    const dataFingerprint = `${animationTrigger}|${dataByProduct
        .map((series) => `${series.productName}:${series.data.map(d => d[dataKey] ?? 0).join(',')}`)
        .join('|')}`;
    const prevFingerprint = useRef('');
    useEffect(() => {
        if (dataFingerprint !== prevFingerprint.current) {
            prevFingerprint.current = dataFingerprint;
            setAnimKey(k => k + 1);
        }
    }, [dataFingerprint]);
    const w = 480, h = 260;
    const pad = { top: 16, right: 24, bottom: 40, left: 40 };
    const iw = w - pad.left - pad.right;
    const ih = h - pad.top - pad.bottom;

    const allVals = dataByProduct.flatMap(series => series.data.map(d => d[dataKey] ?? 0));
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const padding = (rawMax - rawMin) * 0.15 || 1;
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
                <style>{`
                    @keyframes drawLine {
                        from { stroke-dashoffset: var(--path-length); }
                        to   { stroke-dashoffset: 0; }
                    }
                    @keyframes fadeInArea {
                        from { opacity: 0; }
                        to   { opacity: 1; }
                    }
                    @keyframes popIn {
                        0%   { transform: scale(0); opacity: 0; }
                        60%  { transform: scale(1.3); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
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
                const stagger = seriesIdx * 0.1;

                return (
                    <g key={`${seriesIdx}-${animKey}`}>
                        <LineAnimated d={linePath} color={color} delay={stagger} />
                        <path d={areaPath} fill={`url(#lineGrad-${seriesIdx})`}
                            style={{
                                opacity: 0,
                                animation: `fadeInArea 0.3s ease-out ${stagger + 0.5}s forwards`,
                            }} />
                        {vals.map((v, i) => (
                            <circle key={i} cx={px(i, series.data.length)} cy={py(v)}
                                r={tooltip?.idx === i ? 3 : 2.5} fill={color}
                                stroke="white" strokeWidth="1.2"
                                style={{
                                    transformOrigin: `${px(i, series.data.length)}px ${py(v)}px`,
                                    opacity: 0,
                                    animation: `popIn 0.25s ease-out ${stagger + 0.8 + i * 0.04}s forwards`,
                                    transition: 'r 0.15s ease',
                                }} />
                        ))}
                    </g>
                );
            })}

            {xLabels.map((d, i) => (
                <g key={`x-${i}`}>
                    <text x={px(i, xLabels.length)} y={h - 16} textAnchor="middle"
                        fontSize="8" fill="#423b39" fontWeight="500" fontFamily="system-ui, sans-serif">
                        {d.day}
                    </text>
                    <text x={px(i, xLabels.length)} y={h - 5} textAnchor="middle"
                        fontSize="6.5" fill="#8a807c" fontFamily="system-ui, sans-serif">
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
                                    {tv.name}: <tspan fontWeight="600" fill="#423b39">{(Math.round(tv.value * 10) / 10).toLocaleString()}</tspan>
                                </text>
                            </g>
                        ))}
                    </g>
                </>
            )}
        </svg>
    );
}

export default MultiLineChart;
