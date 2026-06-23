import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import AppShell from "../Components/AppShell";
import ChartCard from "../Components/ui/ChartCard";
import EmptyState from "../Components/ui/EmptyState";
import {getCategoryReport, getMonthlySummary, getTopCategories} from "../redux/slices/dashboardSlice";
import {formatCurrency} from "../utils/finance";

const COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const Reports = () => {
    const dispatch = useDispatch();
    const [period, setPeriod] = useState("month");
    const {monthlySummary, categoryReport, topCategories} = useSelector((state) => state.dashboard);

    useEffect(() => {
        dispatch(getMonthlySummary());
        dispatch(getTopCategories({type: "expense", limit: 5}));
    }, [dispatch]);

    useEffect(() => {
        dispatch(getCategoryReport({period, type: "expense"}));
    }, [dispatch, period]);

    const categoryData = useMemo(
        () => (categoryReport?.categories || []).map((item) => ({name: item.categoryName, value: item.totalAmount, percentage: item.percentage})),
        [categoryReport]
    );

    const monthlyData = useMemo(
        () =>
            (monthlySummary?.monthlyData || []).map((item) => ({
                month: item.monthName,
                income: item.totalIncome,
                expense: item.totalExpenses,
                net: item.netBalance,
            })),
        [monthlySummary]
    );

    return (
        <AppShell title="Reports">
            <section className="report-header finance-card">
                <div>
                    <p className="eyebrow">Analytics</p>
                    <h3>Spending intelligence</h3>
                    <p>Review category concentration, monthly movement, and cash-flow balance.</p>
                </div>
                <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                </select>
            </section>

            <section className="kpi-grid compact">
                <div className="finance-card">
                    <p className="eyebrow">Top category</p>
                    <strong className="metric-large">{topCategories?.[0]?.categoryName || "No data"}</strong>
                </div>
                <div className="finance-card">
                    <p className="eyebrow">Report spend</p>
                    <strong className="metric-large">{formatCurrency(categoryReport?.totalAmount || 0)}</strong>
                </div>
                <div className="finance-card">
                    <p className="eyebrow">Tracked categories</p>
                    <strong className="metric-large">{categoryData.length}</strong>
                </div>
            </section>

            <section className="chart-grid">
                <ChartCard title="Expense Categories" subtitle="Share of selected period">
                    {categoryData.length ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={104} label>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </ChartCard>
                <ChartCard title="Income vs Expense" subtitle="Yearly monthly comparison">
                    {monthlyData.length ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="income" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </ChartCard>
            </section>

            <section className="finance-card responsive-table">
                <h3 className="section-title">Category detail</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Transactions</th>
                            <th>Amount</th>
                            <th>Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryReport?.categories?.map((item) => (
                            <tr key={item.categoryName}>
                                <td>{item.categoryName}</td>
                                <td>{item.transactionCount}</td>
                                <td>{formatCurrency(item.totalAmount)}</td>
                                <td>{item.percentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </AppShell>
    );
};

export default Reports;
