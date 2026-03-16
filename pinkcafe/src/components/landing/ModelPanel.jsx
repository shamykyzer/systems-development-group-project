import React from 'react';
import { FaCog } from 'react-icons/fa';

function ModelPanel({ currentForecasts }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-2 flex items-center gap-2">
                <FaCog className="text-xs text-pinkcafe2/50" /> Model
            </h3>
            <p className="text-xs text-pinkcafe2/60">
                {currentForecasts && currentForecasts.length > 0 ? (
                    <>
                        Prophet forecasting<br />• {currentForecasts[0].forecast.length} predictions per product
                    </>
                ) : (
                    <>
                        Prophet forecasting<br />• Awaiting data
                    </>
                )}
            </p>
        </div>
    );
}

export default ModelPanel;
