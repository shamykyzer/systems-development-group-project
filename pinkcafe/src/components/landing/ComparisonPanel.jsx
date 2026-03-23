import React, { useState } from 'react';
import { FaBalanceScale, FaSyncAlt, FaTrophy } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/constants';

const ALGO_LABELS = {
    prophet: 'Prophet',
    sarima: 'SARIMA',
    linear_regression: 'Linear Reg.',
};

function ComparisonPanel({ datasetId, uploadedData }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState('');

    const items = uploadedData?.products || [];
    const itemIds = uploadedData?.itemIds || {};

    const runComparison = async () => {
        const itemId = itemIds[selectedItem];
        if (!datasetId || !itemId) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/v1/forecast/compare?dataset_id=${datasetId}&item_id=${itemId}&train_weeks=20&test_days=14`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Comparison failed');
            setResults(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Find the algorithm with the lowest MAE
    const bestAlgo = results
        ? Object.entries(results.results)
              .filter(([, v]) => !v.error && v.mae != null)
              .sort((a, b) => a[1].mae - b[1].mae)[0]?.[0]
        : null;

    return (
        <div className="rounded-xl overflow-hidden shadow-sm border border-pinkcafe2/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
            <div className="bg-pinkcafe2 px-4 py-2.5 flex items-center gap-2">
                <FaBalanceScale className="text-white/80 text-xs" />
                <h3 className="font-bold text-white text-sm">Algorithm Comparison</h3>
            </div>
            <div className="bg-white p-4">
                {/* Product selector */}
                {items.length > 0 && (
                    <select
                        value={selectedItem}
                        onChange={(e) => { setSelectedItem(e.target.value); setResults(null); }}
                        className="w-full mb-3 px-3 py-2 text-xs border border-pinkcafe2/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-pinkcafe2/40 text-pinkcafe2"
                    >
                        <option value="">Select a product</option>
                        {items.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                )}

                {/* Compare button */}
                <button
                    onClick={runComparison}
                    disabled={loading || !datasetId || !selectedItem}
                    className="w-full bg-pinkcafe2 text-white px-4 py-2.5 rounded-lg font-semibold text-xs hover:bg-pinkcafe2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    <FaSyncAlt className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Comparing...' : 'Compare Algorithms'}
                </button>

                {/* Error */}
                {error && (
                    <p className="mt-3 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                {/* Results table */}
                {results && (
                    <div className="mt-4">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-pinkcafe2/10">
                                    <th className="text-left py-2 font-semibold text-pinkcafe2/70">Algorithm</th>
                                    <th className="text-right py-2 font-semibold text-pinkcafe2/70">MAE</th>
                                    <th className="text-right py-2 font-semibold text-pinkcafe2/70">MSE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(results.results).map(([key, val]) => (
                                    <tr key={key} className="border-b border-pinkcafe2/5 last:border-0">
                                        <td className="py-2 text-pinkcafe2 font-medium flex items-center gap-1.5">
                                            {bestAlgo === key && (
                                                <FaTrophy className="text-amber-500 text-[10px]" />
                                            )}
                                            {ALGO_LABELS[key] || key}
                                        </td>
                                        {val.error ? (
                                            <td colSpan={2} className="py-2 text-right text-pinkcafe2/40 italic">
                                                Failed
                                            </td>
                                        ) : (
                                            <>
                                                <td className={`py-2 text-right font-mono ${bestAlgo === key ? 'text-emerald-600 font-bold' : 'text-pinkcafe2/80'}`}>
                                                    {val.mae}
                                                </td>
                                                <td className={`py-2 text-right font-mono ${bestAlgo === key ? 'text-emerald-600 font-bold' : 'text-pinkcafe2/80'}`}>
                                                    {val.mse}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer info */}
                        <div className="mt-3 pt-2 border-t border-pinkcafe2/10">
                            <p className="text-[10px] text-pinkcafe2/50">
                                Test period: {results.test_period.start} to {results.test_period.end} ({results.test_days} days)
                            </p>
                            {bestAlgo && (
                                <p className="text-[10px] text-emerald-600 font-medium mt-1">
                                    Best: {ALGO_LABELS[bestAlgo]} (lowest MAE)
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Placeholder when no results */}
                {!results && !loading && !error && (
                    <p className="mt-3 text-[10px] text-pinkcafe2/50 text-center">
                        Compare Prophet, SARIMA &amp; Linear Regression accuracy
                    </p>
                )}
            </div>
        </div>
    );
}

export default ComparisonPanel;
