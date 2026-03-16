import React from 'react';
import { CHART_COLORS } from '../../utils/chartUtils';

function ChartLegend({ data }) {
    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center mt-5 pt-4 border-t border-gray-100">
            {data.map((series, idx) => {
                const ci = series.colorIndex ?? idx;
                return (
                    <div key={idx} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
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

export default ChartLegend;
