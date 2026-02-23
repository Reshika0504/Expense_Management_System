import React from "react";

const Transactions = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Transactions Page</h1>
                <p className="text-gray-600">Manage your income and expenses</p>
                <div className="mt-8 p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Features Coming Soon:</h2>
                    <ul className="text-left space-y-2 text-gray-700">
                        <li>• Add new transactions</li>
                        <li>• Edit existing transactions</li>
                        <li>• Filter by date, category, type</li>
                        <li>• Search transactions</li>
                        <li>• Export to CSV/PDF</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
