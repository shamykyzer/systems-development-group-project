import React from 'react';
import { FaCheckDouble, FaPoundSign, FaShoppingBag } from 'react-icons/fa';

const PLACEHOLDER_STATS = [
    { icon: FaCheckDouble, label: 'Training Data' },
    { icon: FaPoundSign, label: 'Products' },
    { icon: FaShoppingBag, label: 'Predictions' }
];

function QuickStatsBar({ stats }) {
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

export default QuickStatsBar;
