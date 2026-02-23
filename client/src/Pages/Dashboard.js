import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {getDashboardOverview} from "../redux/slices/dashboardSlice";
import {logout} from "../redux/slices/authSlice";
import {useNavigate} from "react-router-dom";

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {user, isAuthenticated} = useSelector((state) => state.auth);
    const {overview, loading} = useSelector((state) => state.dashboard);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getDashboardOverview());
        }
    }, [dispatch, isAuthenticated]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Please log in to view dashboard</h2>
                    <button onClick={() => navigate("/login")} className="mt-4 btn-primary">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                            <button onClick={handleLogout} className="btn-secondary">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="dashboard-grid mb-8">
                                <div className="stat-card income-card">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center">
                                                <span className="text-green-600 font-bold">₹</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                ₹{overview?.currentMonth?.totalIncome?.toLocaleString() || "0"}
                                            </p>
                                            {overview?.trends?.incomeChange !== undefined && (
                                                <p
                                                    className={`text-sm ${
                                                        overview.trends.incomeChange >= 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {overview.trends.incomeChange >= 0 ? "↑" : "↓"}{" "}
                                                    {Math.abs(overview.trends.incomeChange)}% from last month
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card expense-card">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-danger-100 flex items-center justify-center">
                                                <span className="text-red-600 font-bold">₹</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                ₹{overview?.currentMonth?.totalExpenses?.toLocaleString() || "0"}
                                            </p>
                                            {overview?.trends?.expenseChange !== undefined && (
                                                <p
                                                    className={`text-sm ${
                                                        overview.trends.expenseChange >= 0
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                    }`}
                                                >
                                                    {overview.trends.expenseChange >= 0 ? "↑" : "↓"}{" "}
                                                    {Math.abs(overview.trends.expenseChange)}% from last month
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card balance-card">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span className="text-primary-600 font-bold">₹</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                ₹
                                                {overview?.currentMonth
                                                    ? (
                                                          overview.currentMonth.totalIncome -
                                                          overview.currentMonth.totalExpenses
                                                      )?.toLocaleString()
                                                    : "0"}
                                            </p>
                                            {overview?.trends?.balanceChange !== undefined && (
                                                <p
                                                    className={`text-sm ${
                                                        overview.trends.balanceChange >= 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {overview.trends.balanceChange >= 0 ? "↑" : "↓"}{" "}
                                                    {Math.abs(overview.trends.balanceChange)}% from last month
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="stat-card bg-white rounded-lg shadow p-6">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <span className="text-gray-600 font-bold">#</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {overview?.currentMonth?.transactionCount || 0}
                                            </p>
                                            <p className="text-sm text-gray-500">This month</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                                </div>
                                <div className="p-6">
                                    {overview?.recentTransactions?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="table-header">Description</th>
                                                        <th className="table-header">Category</th>
                                                        <th className="table-header">Date</th>
                                                        <th className="table-header text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {overview.recentTransactions.map((transaction) => (
                                                        <tr key={transaction._id}>
                                                            <td className="table-cell">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {transaction.description || "No description"}
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="flex items-center">
                                                                    <span
                                                                        className="h-2 w-2 rounded-full mr-2"
                                                                        style={{
                                                                            backgroundColor:
                                                                                transaction.type === "income"
                                                                                    ? "#10B981"
                                                                                    : "#EF4444",
                                                                        }}
                                                                    ></span>
                                                                    <span className="text-sm text-gray-900">
                                                                        {transaction.category}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="table-cell">
                                                                <div className="text-sm text-gray-500">
                                                                    {new Date(transaction.date).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="table-cell text-right">
                                                                <span
                                                                    className={`text-sm font-medium ${
                                                                        transaction.type === "income"
                                                                            ? "text-green-600"
                                                                            : "text-red-600"
                                                                    }`}
                                                                >
                                                                    {transaction.type === "income" ? "+" : "-"} ₹
                                                                    {transaction.amount.toLocaleString()}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500">No transactions yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
