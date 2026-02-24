import React, { useState } from 'react';

function LandingPagePanel(){
    // State to track which graph is currently displayed in the main area
    const [mainGraph, setMainGraph] = useState('graph1');
    
    // Mock graph data - replace with actual chart components later
    const graphs = {
        graph1: {
            title: 'Coffee Sales Forecast',
            subtitle: 'Next 7 days prediction',
            value: '342 units',
            change: '+15.3%',
            isPositive: true,
            color: 'from-pink-50 to-pink-100'
        },
        graph2: {
            title: 'Pastry Demand Prediction',
            subtitle: 'Weekly forecast',
            value: '567 units',
            change: '+8.7%',
            isPositive: true,
            color: 'from-pink-50 to-rose-100'
        },
        graph3: {
            title: 'Sandwich Sales Trend',
            subtitle: 'Upcoming week',
            value: '289 units',
            change: '+12.1%',
            isPositive: true,
            color: 'from-pink-50 to-fuchsia-100'
        }
    };
    
    return(
        <div className="ml-0 md:ml-64 bg-pinkcafe p-4 md:p-8 w-auto min-h-screen transition-all duration-300">
            {/* Header */}
            <div className="mb-8 mt-16 md:mt-0">
                <h1 className="text-3xl md:text-5xl font-bold text-pinkcafe2 mb-2">Sales Forecasting Dashboard</h1>
                <p className="text-pinkcafe2 text-base md:text-lg opacity-80">AI-powered product demand predictions</p>
            </div>
            
            {/* Graph Layout */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[650px]">
                {/* Main Large Graph */}
                <div className="flex-grow md:w-2/3 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[400px] md:min-h-0">
                    {/* Header Section */}
                    <div className="bg-pinkcafe2 p-4 md:p-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                            {graphs[mainGraph].title}
                        </h2>
                        <p className="text-white opacity-90 text-sm mb-4">{graphs[mainGraph].subtitle}</p>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl md:text-5xl font-bold text-white">{graphs[mainGraph].value}</span>
                            <span className={`text-lg md:text-xl font-semibold mb-2 ${
                                graphs[mainGraph].isPositive ? 'text-green-300' : 'text-red-300'
                            }`}>
                                {graphs[mainGraph].change}
                            </span>
                        </div>
                    </div>
                    
                    {/* Chart Area */}
                    <div className={`flex-1 bg-gradient-to-br ${graphs[mainGraph].color} flex items-center justify-center p-8`}>
                        <div className="text-center text-gray-600">
                            <p className="text-lg font-medium">Prophet forecast visualization</p>
                            <p className="text-sm mt-2 opacity-70">Time series prediction chart will display here</p>
                        </div>
                    </div>
                </div>
                
                {/* Smaller Graphs Panel */}
                <div className="w-full md:w-1/3 flex flex-col gap-4">
                    {Object.keys(graphs).map((graphKey) => (
                        <div
                            key={graphKey}
                            onClick={() => setMainGraph(graphKey)}
                            className={`bg-white rounded-xl shadow-lg p-4 md:p-5 cursor-pointer transition-all duration-300 flex flex-col ${
                                mainGraph === graphKey 
                                    ? 'ring-4 ring-pinkcafe2 shadow-2xl' 
                                    : 'hover:shadow-2xl hover:-translate-y-1'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-pinkcafe2">
                                        {graphs[graphKey].title}
                                    </h3>
                                    <p className="text-xs text-gray-500">{graphs[graphKey].subtitle}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                    graphs[graphKey].isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {graphs[graphKey].change}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 mb-3">{graphs[graphKey].value}</p>
                            <div className={`h-24 bg-gradient-to-br ${graphs[graphKey].color} rounded-lg border border-pink-200`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

}

export default LandingPagePanel;