import React from 'react';
import { FaFolderOpen } from 'react-icons/fa';

function DatasetSelector({ allDatasets, selectedDatasetId, onDatasetChange }) {
    if (allDatasets.length <= 1) return null;
    return (
        <div className="bg-white rounded-xl shadow-sm border border-pinkcafe2/10 p-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-pinkcafe2/10 hover:border-pinkcafe2/20">
            <h3 className="font-bold text-pinkcafe2 text-sm mb-3 flex items-center gap-2">
                <FaFolderOpen className="text-xs text-pinkcafe2/50" /> Select Dataset
            </h3>
            <select
                value={selectedDatasetId || ''}
                onChange={(e) => onDatasetChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-pinkcafe2/20 rounded-lg text-sm text-pinkcafe2 focus:outline-none focus:ring-2 focus:ring-pinkcafe2/50"
            >
                {allDatasets.map(dataset => (
                    <option key={dataset.datasetId} value={dataset.datasetId}>
                        {dataset.displayName || dataset.fileName}
                    </option>
                ))}
            </select>
            <p className="text-xs text-pinkcafe2/60 mt-2">
                {allDatasets.length} dataset{allDatasets.length > 1 ? 's' : ''} available
            </p>
        </div>
    );
}

export default DatasetSelector;
