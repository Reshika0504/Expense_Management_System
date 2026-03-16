import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {getDashboardOverview} from "../redux/slices/dashboardSlice";
import AppShell from "../Components/AppShell";

const Dashboard = () => {
    const dispatch = useDispatch();
    const {isAuthenticated} = useSelector((state) => state.auth);
    const {overview, loading} = useSelector((state) => state.dashboard);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getDashboardOverview());
        }
    }, [dispatch, isAuthenticated]);

    return (
        <AppShell title="Dashboard Overview">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <>
                    <div className="dashboard-grid mb-8">
                        <div className="stat-card income-card">
                            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                Rs {overview?.currentMonth?.totalIncome?.toLocaleString() || "0"}
                            </p>
                        </div>
                        <div className="stat-card expense-card">
                            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                Rs {overview?.currentMonth?.totalExpenses?.toLocaleString() || "0"}
                            </p>
                        </div>
                        <div className="stat-card balance-card">
                            <h3 className="text-sm font-medium text-gray-500">Net Balance</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                Rs {overview?.currentMonth?.netBalance?.toLocaleString() || "0"}
                            </p>
                        </div>
                        <div className="stat-card">
                            <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {overview?.currentMonth?.transactionCount || 0}
                            </p>
                        </div>
                    </div>

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
                                                    <td className="table-cell">{transaction.description || "N/A"}</td>
                                                    <td className="table-cell">{transaction.category}</td>
                                                    <td className="table-cell">
                                                        {new Date(transaction.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="table-cell text-right">
                                                        <span
                                                            className={
                                                                transaction.type === "income"
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }
                                                        >
                                                            {transaction.type === "income" ? "+" : "-"} Rs{" "}
                                                            {transaction.amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">No transactions yet.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </AppShell>
    );
};

export default Dashboard;
