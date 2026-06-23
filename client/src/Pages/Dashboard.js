import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {getDashboardOverview} from "../redux/slices/dashboardSlice";
import {updateProfile} from "../redux/slices/authSlice";
import AppShell from "../Components/AppShell";
import {Button, InputNumber, message} from "antd";

const Dashboard = () => {
    const dispatch = useDispatch();
    const {isAuthenticated, user, loading: profileLoading} = useSelector((state) => state.auth);
    const {overview, loading} = useSelector((state) => state.dashboard);
    const [budgetValue, setBudgetValue] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getDashboardOverview());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        setBudgetValue(user?.monthlyBudget ?? 0);
    }, [user?.monthlyBudget]);

    const handleBudgetSave = async () => {
        try {
            await dispatch(updateProfile({monthlyBudget: budgetValue ?? 0})).unwrap();
            await dispatch(getDashboardOverview()).unwrap();
            message.success("Monthly budget updated");
        } catch (error) {
            message.error(error || "Failed to update monthly budget");
        }
    };

    const monthlyBudget = user?.monthlyBudget ?? 0;
    const currentMonthIncome = overview?.currentMonth?.totalIncome ?? 0;
    const currentMonthExpenses = overview?.currentMonth?.totalExpenses ?? 0;
    const remainingBudget = monthlyBudget - currentMonthExpenses;
    const monthlyTransactionCount = overview?.currentMonth?.transactionCount ?? 0;
    const totalTransactionCount = overview?.totals?.transactionCount ?? 0;

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
                            <h3 className="text-sm font-medium text-gray-500">Monthly Budget</h3>
                            <div className="budget-editor">
                                <InputNumber
                                    min={0}
                                    value={budgetValue}
                                    onChange={(value) => setBudgetValue(value ?? 0)}
                                    className="budget-input"
                                    formatter={(value) => (value === undefined || value === null ? "" : `Rs ${value}`)}
                                    parser={(value) => (value || "").replace(/[^\d.]/g, "")}
                                />
                                <Button
                                    type="primary"
                                    onClick={handleBudgetSave}
                                    loading={profileLoading}
                                    disabled={budgetValue === monthlyBudget}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                        <div className="stat-card income-card">
                            <h3 className="text-sm font-medium text-gray-500">Monthly Income</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                Rs {currentMonthIncome.toLocaleString()}
                            </p>
                        </div>
                        <div className="stat-card expense-card">
                            <h3 className="text-sm font-medium text-gray-500">Monthly Expenses</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                Rs {currentMonthExpenses.toLocaleString()}
                            </p>
                        </div>
                        <div className={`stat-card ${remainingBudget < 0 ? "expense-card" : "balance-card"}`}>
                            <h3 className="text-sm font-medium text-gray-500">Remaining Budget</h3>
                            <p className="text-2xl font-semibold text-gray-900">Rs {remainingBudget.toLocaleString()}</p>
                        </div>
                        <div className="stat-card">
                            <h3 className="text-sm font-medium text-gray-500">Monthly Transactions</h3>
                            <p className="text-2xl font-semibold text-gray-900">{monthlyTransactionCount}</p>
                        </div>
                        <div className="stat-card">
                            <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                            <p className="text-2xl font-semibold text-gray-900">{totalTransactionCount}</p>
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
