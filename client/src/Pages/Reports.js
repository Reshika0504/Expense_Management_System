import React from "react";

const Reports = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
                <p className="text-gray-600">Detailed financial insights and reports</p>
                <div className="mt-8 p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Features Coming Soon:</h2>
                    <ul className="text-left space-y-2 text-gray-700">
                        <li>• Monthly summary reports</li>
                        <li>• Category-wise spending analysis</li>
                        <li>• Interactive charts and graphs</li>
                        <li>• Spending trends visualization</li>
                        <li>• Budget vs actual comparison</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Reports;
