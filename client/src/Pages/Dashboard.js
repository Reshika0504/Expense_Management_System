import React, {useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import AppShell from "../Components/AppShell";
import KpiCard from "../Components/ui/KpiCard";
import ChartCard from "../Components/ui/ChartCard";
import EmptyState from "../Components/ui/EmptyState";
import Skeleton from "../Components/ui/Skeleton";
import {getCategoryReport, getDashboardOverview, getMonthlySummary, getTopCategories} from "../redux/slices/dashboardSlice";
import {clampPercent, formatCurrency, formatPercent, getMonthLabel} from "../utils/finance";

const COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const Dashboard = () => {
    const dispatch = useDispatch();
    const {isAuthenticated, user} = useSelector((state) => state.auth);
    const {overview, monthlySummary, categoryReport, topCategories, loading} = useSelector((state) => state.dashboard);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getDashboardOverview());
            dispatch(getMonthlySummary());
            dispatch(getCategoryReport({period: "month", type: "expense"}));
            dispatch(getTopCategories({type: "expense", limit: 5}));
        }
    }, [dispatch, isAuthenticated]);

    const metrics = useMemo(() => {
        const income = overview?.currentMonth?.totalIncome ?? 0;
        const configuredIncome = user?.monthlyIncome ?? 0;
        const effectiveIncome = income || configuredIncome;
        const expenses = overview?.currentMonth?.totalExpenses ?? 0;
        const budget = user?.monthlyBudget ?? 0;
        const savings = effectiveIncome - expenses;
        const savingsGoal = user?.monthlySavingsGoal ?? 0;
        const dayOfMonth = new Date().getDate();
        const budgetUtilization = budget > 0 ? (expenses / budget) * 100 : 0;
        const savingsRate = effectiveIncome > 0 ? (savings / effectiveIncome) * 100 : 0;
        const topCategory = topCategories?.[0];

        return {
            income,
            configuredIncome,
            effectiveIncome,
            expenses,
            budget,
            savings,
            savingsGoal,
            budgetUtilization,
            savingsRate,
            avgDailySpend: expenses / dayOfMonth,
            topCategory: topCategory?.categoryName || "No spend yet",
            topCategoryAmount: topCategory?.totalAmount || 0,
        };
    }, [overview, topCategories, user]);

    const categoryData = useMemo(
        () =>
            (categoryReport?.categories || []).map((item) => ({
                name: item.categoryName,
                value: item.totalAmount,
            })),
        [categoryReport]
    );

    const monthlyData = useMemo(
        () =>
            (monthlySummary?.monthlyData || []).map((item) => ({
                month: item.monthName || getMonthLabel(item.month),
                income: item.totalIncome,
                expense: item.totalExpenses,
                savings: item.netBalance,
            })),
        [monthlySummary]
    );

    const insights = useMemo(() => {
        const trend = monthlyData.length > 1 ? monthlyData[monthlyData.length - 1].expense - monthlyData[monthlyData.length - 2].expense : 0;
        return [
            `Budget utilization is ${formatPercent(metrics.budgetUtilization)} for this month.`,
            `Highest spending category is ${metrics.topCategory} at ${formatCurrency(metrics.topCategoryAmount)}.`,
            trend > 0
                ? `Spending increased by ${formatCurrency(trend)} compared with last month.`
                : `Spending is ${formatCurrency(Math.abs(trend))} lower than last month.`,
        ];
    }, [metrics, monthlyData]);

    return (
        <AppShell title="Dashboard">
            <section className="hero-panel">
                <div>
                    <p className="eyebrow">Monthly health</p>
                    <h2>{formatCurrency(metrics.savings)} projected savings</h2>
                    <p>Track budget pressure, category concentration, and cash flow from one responsive workspace.</p>
                </div>
                <div className="budget-meter" aria-label="Budget utilization">
                    <span>Budget used</span>
                    <strong>{formatPercent(metrics.budgetUtilization)}</strong>
                    <div className="progress-track">
                        <div className="progress-fill" style={{width: `${clampPercent(metrics.budgetUtilization)}%`}} />
                    </div>
                </div>
            </section>

            {loading ? (
                <Skeleton rows={6} />
            ) : (
                <>
                    <section className="kpi-grid">
                        <KpiCard label="Income" value={formatCurrency(metrics.effectiveIncome)} detail="Recorded or monthly income target" accent="teal" icon="+" />
                        <KpiCard label="Expenses" value={formatCurrency(metrics.expenses)} detail="Current month spending" accent="rose" icon="-" />
                        <KpiCard label="Savings Rate" value={formatPercent(metrics.savingsRate)} detail="Monthly savings percentage" accent="indigo" icon="%" />
                        <KpiCard label="Avg Daily Spend" value={formatCurrency(metrics.avgDailySpend)} detail="Based on current month" accent="amber" icon="D" />
                    </section>

                    <section className="insight-grid">
                        <div className="finance-card">
                            <h3 className="section-title">Financial Insights</h3>
                            <div className="insight-list">
                                {insights.map((insight) => (
                                    <p key={insight}>{insight}</p>
                                ))}
                            </div>
                        </div>
                        <div className="finance-card">
                            <h3 className="section-title">Savings Goal</h3>
                            <p className="metric-large">{formatCurrency(metrics.savingsGoal)}</p>
                            <div className="progress-track">
                                <div
                                    className="progress-fill savings-fill"
                                    style={{width: `${clampPercent(metrics.savingsGoal > 0 ? (metrics.savings / metrics.savingsGoal) * 100 : 0)}%`}}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="chart-grid">
                        <ChartCard title="Category Breakdown" subtitle="Expense share this month">
                            {categoryData.length ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96} paddingAngle={3}>
                                            {categoryData.map((entry, index) => (
                                                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="No category data" />
                            )}
                        </ChartCard>

                        <ChartCard title="Monthly Spending Trend" subtitle="Expense movement by month">
                            {monthlyData.length ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="No trend data" />
                            )}
                        </ChartCard>

                        <ChartCard title="Income vs Expense" subtitle="Monthly cash-flow comparison">
                            {monthlyData.length ? (
                                <ResponsiveContainer width="100%" height={280}>
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
                                <EmptyState title="No cash-flow data" />
                            )}
                        </ChartCard>
                    </section>
                </>
            )}
        </AppShell>
    );
};

export default Dashboard;
