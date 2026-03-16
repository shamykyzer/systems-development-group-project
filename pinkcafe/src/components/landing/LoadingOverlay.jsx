import React from 'react';
import { FaChartLine } from 'react-icons/fa';

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

export default LoadingOverlay;
