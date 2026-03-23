import React, { useEffect } from 'react';
import { FaBalanceScale, FaSyncAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/constants';

function ComparisonPanel({ datasetId, uploadedData, selectedProduct, onResults, loading, setLoading }) {
    const items = uploadedData?.products || [];
    const itemIds = uploadedData?.itemIds || {};
    // Clear results when product changes
    useEffect(() => {
        onResults?.(null);
    }, [selectedProduct]);

    const fetchComparison = async (itemId) => {
        const res = await fetch(
            `${API_BASE_URL}/api/v1/forecast/compare?dataset_id=${datasetId}&item_id=${itemId}&train_weeks=20&test_days=14`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Comparison failed');
        return data;
    };

    const round = (v) => Math.round(v * 100) / 100;

    const runComparison = async () => {
        if (!datasetId || items.length === 0) return;

        setLoading(true);
        onResults?.(null);

        try {
            let result;
            if (selectedProduct === 'all') {
                const allResults = await Promise.all(
                    items.map((name) => fetchComparison(itemIds[name]))
                );
                const algos = ['prophet', 'sarima', 'linear_regression'];
                const averaged = {};
                for (const algo of algos) {
                    const valid = allResults
                        .map((r) => r.results[algo])
                        .filter((v) => !v.error && v.mae != null);
                    if (valid.length > 0) {
                        averaged[algo] = {
                            mae: round(valid.reduce((s, v) => s + v.mae, 0) / valid.length),
                            mse: round(valid.reduce((s, v) => s + v.mse, 0) / valid.length),
                        };
                    } else {
                        averaged[algo] = { error: 'Failed for all products' };
                    }
                }
                result = {
                    ...allResults[0],
                    results: averaged,
                    _label: `All ${items.length} products (avg)`,
                };
            } else {
                const itemId = itemIds[selectedProduct];
                if (!itemId) return;
                const data = await fetchComparison(itemId);
                result = { ...data, _label: selectedProduct };
            }

            // Find best algorithm
            const best = Object.entries(result.results)
                .filter(([, v]) => !v.error && v.mae != null)
                .sort((a, b) => a[1].mae - b[1].mae)[0]?.[0];
            result._best = best;

            onResults?.(result);
        } catch (e) {
            console.error('Comparison failed:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <button
                onClick={runComparison}
                disabled={loading || !datasetId || items.length === 0}
                className="w-full bg-pinkcafe2 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-pinkcafe2/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
                <FaBalanceScale className="w-4 h-4 flex-shrink-0" />
                {loading ? (
                    <><FaSyncAlt className="w-3 h-3 animate-spin" /> Comparing...</>
                ) : (
                    'Compare Algorithms'
                )}
            </button>
            <p className="text-xs text-pinkcafe2/60 mt-2 text-center">
                {selectedProduct === 'all'
                    ? `Compare across all ${items.length} products`
                    : `Compare for ${selectedProduct}`}
            </p>
        </div>
    );
}

export default ComparisonPanel;
