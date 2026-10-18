import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import {FiPlus, FiArrowDownLeft, FiArrowUpRight, FiBarChart2, FiTarget, FiStar} from "react-icons/fi";
import {
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
import {createTransaction} from "../redux/slices/transactionSlice";
import {getCategories} from "../redux/slices/categorySlice";
import {clampPercent, formatCurrency, getMonthLabel} from "../utils/finance";

const COLORS = ["#e45a99", "#a855c9", "#fb923c", "#d98dc2", "#818cf8", "#38bdf8"];

// Helper to match category to an icon
const getCategoryIcon = (categoryName = "", type = "expense") => {
    if (type === "income") return "💰";
    
    const name = categoryName.toLowerCase();
    if (name.includes("food") || name.includes("dining") || name.includes("eat")) return "🍔";
    if (name.includes("car") || name.includes("transport") || name.includes("taxi")) return "🚗";
    if (name.includes("shop") || name.includes("cloth")) return "🛍️";
    if (name.includes("rent") || name.includes("house") || name.includes("home")) return "🏠";
    if (name.includes("health") || name.includes("doctor") || name.includes("hospital")) return "🏥";
    if (name.includes("entertainment") || name.includes("movie") || name.includes("show")) return "🎬";
    if (name.includes("bill") || name.includes("utility") || name.includes("power") || name.includes("light")) return "💡";
    if (name.includes("travel") || name.includes("flight") || name.includes("hotel")) return "✈️";
    if (name.includes("study") || name.includes("education") || name.includes("book")) return "📚";
    if (name.includes("insurance") || name.includes("secure")) return "🛡️";
    
    return "💸";
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {isAuthenticated, user} = useSelector((state) => state.auth);
    const {overview, monthlySummary, categoryReport, topCategories, loading, error, overviewStatus, overviewError} = useSelector((state) => state.dashboard);
    const {categories} = useSelector((state) => state.categories);

    // Quick Add Expense modal state
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickForm, setQuickForm] = useState({
        type: "expense",
        category: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        description: "",
        paymentMethod: "cash",
    });

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getDashboardOverview());
            dispatch(getMonthlySummary());
            dispatch(getCategoryReport({period: "month", type: "expense"}));
            dispatch(getTopCategories({type: "expense", limit: 5}));
            dispatch(getCategories());
        }
    }, [dispatch, isAuthenticated]);

    const reportError=overviewError || error;

    // Set default category when categories load
    useEffect(() => {
        const expenseCats = categories.filter((c) => c.type === "expense");
        if (expenseCats.length > 0 && !quickForm.category) {
            setQuickForm((prev) => ({...prev, category: expenseCats[0].name}));
        }
    }, [categories, quickForm.category]);

    const metrics = useMemo(() => {
        const income = overview?.currentMonth?.totalIncome ?? 0;
        const configuredIncome = user?.monthlyIncome ?? 0;
        const effectiveIncome = income;
        const expenses = overview?.currentMonth?.totalExpenses ?? 0;
        const budget = user?.monthlyBudget ?? 0;
        const savings = overview?.currentMonth?.netBalance ?? 0;
        const savingsGoal = user?.monthlySavingsGoal ?? 0;
        const dayOfMonth = new Date().getDate();
        const budgetUtilization = budget > 0 ? (expenses / budget) * 100 : 0;
        const savingsRate = effectiveIncome > 0 ? (savings / effectiveIncome) * 100 : 0;
        const topCategory = topCategories?.[0];
        const budgetRemaining = budget > 0 ? budget - expenses : 0;

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
            budgetRemaining,
            avgDailySpend: expenses / dayOfMonth,
            topCategory: topCategory?.categoryName || "No spend yet",
            topCategoryAmount: topCategory?.totalAmount || 0,
        };
    }, [overview, topCategories, user]);

    // Financial Health Score calculation
    const healthScore = useMemo(() => {
        let score = 0;
        const tips = [];

        // 1. Savings Rate (Max 40 points)
        if (metrics.savingsRate >= 30) {
            score += 40;
            tips.push("Excellent: Your savings rate is above the recommended 30% threshold.");
        } else if (metrics.savingsRate >= 10) {
            score += 20;
            tips.push("Good: You're saving, but try to reach 20% to accelerate wealth growth.");
        } else if (metrics.savingsRate > 0) {
            score += 10;
            tips.push("Warning: Low savings rate. Review shopping and food categories to cut back.");
        } else {
            tips.push("Critical: Spending exceeds income. Prioritize mapping essential budget caps.");
        }

        // 2. Budget compliance (Max 30 points)
        if (metrics.budget === 0) {
            score += 15;
            tips.push("Goal: Set a monthly budget goal to unlock full compliance scoring.");
        } else if (metrics.expenses <= metrics.budget) {
            score += 30;
            tips.push("Compliant: Spending is currently within your overall monthly budget limit.");
        } else if (metrics.expenses <= metrics.budget * 1.1) {
            score += 15;
            tips.push("Alert: You've slightly exceeded your monthly budget. Pause non-essential buys.");
        } else {
            tips.push("Overspent: You've significantly breached your budget limit. Restrict cards.");
        }

        // 3. Category Concentration (Max 30 points)
        if (metrics.expenses === 0) {
            score += 30;
        } else {
            const maxCategoryAmount = metrics.topCategoryAmount;
            const ratio = maxCategoryAmount / metrics.expenses;
            if (ratio < 0.5) {
                score += 30;
                tips.push("Healthy: Expenses are well diversified across categories.");
            } else {
                score += 15;
                tips.push(`Concentrated: ${metrics.topCategory} accounts for > 50% of your total spend.`);
            }
        }

        return {
            score,
            rating: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Attention" : "Critical",
            tip: tips[Math.floor(Math.random() * tips.length)] || "Log more expenses to generate health suggestions.",
        };
    }, [metrics]);

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

    const handleQuickAddSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...quickForm,
            amount: Number(quickForm.amount),
            date: new Date(quickForm.date).toISOString(),
        };

        try {
            await dispatch(createTransaction(payload)).unwrap();
            toast.success("Expense added successfully");
            setShowQuickAdd(false);
            
            // Reload dashboard widgets
            dispatch(getDashboardOverview());
            dispatch(getMonthlySummary());
            dispatch(getCategoryReport({period: "month", type: "expense"}));
            dispatch(getTopCategories({type: "expense", limit: 5}));
        } catch (error) {
            toast.error(error || "Failed to add expense");
        }
    };

    return (
        <AppShell title="Dashboard">
            {/* Quick Add Modal */}
            {showQuickAdd && (
                <div className="cropper-modal-overlay">
                    <div className="cropper-modal-content finance-card confirm-modal">
                        <h3>Quick Add Expense</h3>
                        <form onSubmit={handleQuickAddSubmit} style={{display: "grid", gap: "1rem", marginTop: "1rem"}}>
                            <label style={{display: "flex", flexDirection: "column", gap: "0.25rem"}}>
                                Category
                                <select
                                    value={quickForm.category}
                                    onChange={(e) => setQuickForm({...quickForm, category: e.target.value})}
                                    required
                                >
                                    {categories.filter(c => c.type === "expense").map((c) => (
                                        <option value={c.name} key={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </label>
                            <label style={{display: "flex", flexDirection: "column", gap: "0.25rem"}}>
                                Amount
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={quickForm.amount}
                                    onChange={(e) => setQuickForm({...quickForm, amount: e.target.value})}
                                    placeholder="0.00"
                                    required
                                />
                            </label>
                            <label style={{display: "flex", flexDirection: "column", gap: "0.25rem"}}>
                                Date
                                <input
                                    type="date"
                                    value={quickForm.date}
                                    onChange={(e) => setQuickForm({...quickForm, date: e.target.value})}
                                    required
                                />
                            </label>
                            <label style={{display: "flex", flexDirection: "column", gap: "0.25rem"}}>
                                Method
                                <select
                                    value={quickForm.paymentMethod}
                                    onChange={(e) => setQuickForm({...quickForm, paymentMethod: e.target.value})}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="debit_card">Debit Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="digital_wallet">Digital Wallet</option>
                                    <option value="other">Other</option>
                                </select>
                            </label>
                            <label style={{display: "flex", flexDirection: "column", gap: "0.25rem"}}>
                                Description
                                <input
                                    value={quickForm.description}
                                    onChange={(e) => setQuickForm({...quickForm, description: e.target.value})}
                                    placeholder="Lunch, taxi fare, grocery..."
                                />
                            </label>
                            <div className="modal-actions" style={{marginTop: "0.5rem"}}>
                                <button type="button" className="ghost-button" onClick={() => setShowQuickAdd(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-button">
                                    Log Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <section className="dashboard-welcome">
                <div>
                    <span className="welcome-date"><FiStar aria-hidden="true" /> {new Date().toLocaleDateString("en-IN", {month: "long", year: "numeric"})} · YOUR MONEY STORY</span>
                    <h2>A little clarity.<br /><span>A brighter month.</span></h2>
                    <p>Make space for your plans, your progress, and the things you love.</p>
                </div>
                <div className="welcome-budget">
                    <span>Your monthly budget</span>
                    <strong>{metrics.budget > 0 ? formatCurrency(metrics.budget) : "Let's make a plan"}</strong>
                    <div className="progress-track"><div className="progress-fill" style={{width: `${clampPercent(metrics.budgetUtilization)}%`}} /></div>
                    <span>{!overview ? 'Budget usage unavailable until totals load.' : metrics.budget > 0 ? `${Math.round(metrics.budgetUtilization)}% used this month` : "Set a budget in your profile to get started."}</span>
                </div>
            </section>
            {reportError && <div className="connection-notice dashboard-error" role="alert"><span>{reportError}</span><button className="ghost-button" onClick={() => {dispatch(getDashboardOverview()); dispatch(getMonthlySummary()); dispatch(getCategoryReport({period: "month", type: "expense"})); dispatch(getTopCategories({type: "expense", limit: 5}));}}>Try again</button></div>}
            {/* Quick Actions Panel */}
            <section className="quick-actions-bar finance-card">
                <button type="button" className="quick-action-btn" onClick={() => setShowQuickAdd(true)}>
                    <FiPlus aria-hidden="true" /> Add expense
                </button>
                <button type="button" className="quick-action-btn" onClick={() => navigate("/income")}>
                    <FiArrowDownLeft aria-hidden="true" /> Add income
                </button>
                <button type="button" className="quick-action-btn" onClick={() => navigate("/reports")}>
                    <FiBarChart2 aria-hidden="true" /> View reports
                </button>
                <button type="button" className="quick-action-btn" onClick={() => navigate("/profile")}>
                    <FiTarget aria-hidden="true" /> Set budgets
                </button>
            </section>

            {!overview && overviewStatus==='failed' ? (
                <EmptyState title="Your recorded totals are unavailable" message="Use Try again above to reload your report. No zero totals have been assumed." />
            ) : loading || !overview ? (
                <Skeleton rows={6} />
            ) : (
                <>
                    {/* Key KPI cards */}
                    <section className="kpi-grid">
                        <KpiCard label="Total Income" value={formatCurrency(metrics.effectiveIncome)} detail="Recorded income this month" accent="teal" icon={<FiArrowDownLeft />} />
                        <KpiCard label="Total Expenses" value={formatCurrency(metrics.expenses)} detail="Current Month Spending" accent="rose" icon={<FiArrowUpRight />} />
                        <KpiCard label="Net Savings" value={formatCurrency(metrics.savings)} detail="Current cash flow surplus" accent="indigo" icon={<FiStar />} />
                        <KpiCard
                            label="Budget Remaining"
                            value={metrics.budget > 0 ? formatCurrency(metrics.budgetRemaining) : "No Limit Set"}
                            detail="Remaining out of total budget limit"
                            accent={metrics.budgetRemaining < 0 ? "rose" : "amber"}
                            icon={<FiTarget />}
                        />
                    </section>

                    {/* Financial Health Score & Goals Section */}
                    <section className="insight-grid">
                        {/* Financial Health Score Radial widget */}
                        <div className="finance-card health-score-widget">
                            <h3 className="section-title">Financial Health Score</h3>
                            <div className="health-score-content">
                                <div className="radial-score-container">
                                    <svg className="radial-score-svg" viewBox="0 0 100 100">
                                        <circle className="circle-bg" cx="50" cy="50" r="40" />
                                        <circle
                                            className={`circle-progress ${healthScore.rating.toLowerCase().replace(" ", "-")}`}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            strokeDasharray="251.2"
                                            strokeDashoffset={251.2 - (251.2 * healthScore.score) / 100}
                                        />
                                    </svg>
                                    <div className="radial-score-label">
                                        <strong>{healthScore.score}</strong>
                                        <span>/ 100</span>
                                    </div>
                                </div>
                                <div className="health-score-details">
                                    <span className={`rating-badge ${healthScore.rating.toLowerCase().replace(" ", "-")}`}>
                                        {healthScore.rating}
                                    </span>
                                    <p className="health-tip">{healthScore.tip}</p>
                                </div>
                            </div>
                        </div>

                        {/* Savings Goal Progress */}
                        <div className="finance-card">
                            <h3 className="section-title">Savings Goal Progress</h3>
                            <div className="savings-goal-content">
                                <div className="goal-numbers">
                                    <div>
                                        <span>Goal Target</span>
                                        <strong>{formatCurrency(metrics.savingsGoal)}</strong>
                                    </div>
                                    <div>
                                        <span>Current Net</span>
                                        <strong>{formatCurrency(metrics.savings)}</strong>
                                    </div>
                                </div>
                                <div className="progress-track" style={{margin: "1rem 0"}}>
                                    <div
                                        className="progress-fill savings-fill"
                                        style={{width: `${clampPercent(metrics.savingsGoal > 0 ? (metrics.savings / metrics.savingsGoal) * 100 : 0)}%`}}
                                    />
                                </div>
                                <p className="eyebrow text-center">
                                    {metrics.savingsGoal > 0
                                        ? `${((metrics.savings / metrics.savingsGoal) * 100).toFixed(0)}% of goal reached`
                                        : "Configure savings goal in your settings tab."}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Chart Dashboard Widgets */}
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

                        <ChartCard title="Monthly Cash Flow" subtitle="Rolling budget comparison">
                            {monthlyData.length ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} />
                                        <Line type="monotone" dataKey="income" stroke="#14b8a6" strokeWidth={3} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="No trend data" />
                            )}
                        </ChartCard>
                    </section>

                    {/* Recent Transactions Widget */}
                    <section className="finance-card dashboard-transactions">
                        <h3 className="section-title">Recent Transactions</h3>
                        <p className="eyebrow" style={{marginBottom: "1rem"}}>Your last 5 logged transactions</p>

                        {overview?.recentTransactions?.length ? (
                            <div className="recent-transactions-list">
                                {overview.recentTransactions.map((tx) => (
                                    <div key={tx._id} className="recent-tx-item">
                                        <div className="tx-meta-wrapper">
                                            <div className={`tx-icon-circle ${tx.type}`}>
                                                {getCategoryIcon(tx.category, tx.type)}
                                            </div>
                                            <div>
                                                <h4>{tx.description || tx.category}</h4>
                                                <span>{new Date(tx.date).toLocaleDateString()} • {tx.paymentMethod.replace("_", " ")}</span>
                                            </div>
                                        </div>
                                        <div className="tx-amount-wrapper">
                                            <strong className={tx.type === "income" ? "amount-positive" : "amount-negative"}>
                                                {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                                            </strong>
                                            <span className={`pill ${tx.type}`}>{tx.category}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="No transactions yet" message="Add transactions above or head to the transactions page." />
                        )}
                    </section>
                </>
            )}
        </AppShell>
    );
};

export default Dashboard;
