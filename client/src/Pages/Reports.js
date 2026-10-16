import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Area,
    AreaChart,
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
    Legend,
} from "recharts";
import AppShell from "../Components/AppShell";
import ChartCard from "../Components/ui/ChartCard";
import EmptyState from "../Components/ui/EmptyState";
import {getCategoryReport, getMonthlySummary} from "../redux/slices/dashboardSlice";
import {updateProfile} from "../redux/slices/authSlice";
import {formatCurrency} from "../utils/finance";

const COLORS = ["#14b8a6", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const Reports = () => {
    const dispatch = useDispatch();
    const {token, user} = useSelector((state) => state.auth);
    const [period, setPeriod] = useState("month");
    const [customDates, setCustomDates] = useState({startDate: "", endDate: ""});
    const [applyCustomDate, setApplyCustomDate] = useState(false);
    
    // Local state for combined 12-month rolling data
    const [rollingData, setRollingData] = useState([]);
    // Local state for transactions used in recurring detection
    const [allTransactions, setAllTransactions] = useState([]);

    // Budget configuration local state
    const [budgetConfig, setBudgetConfig] = useState({category: "", budget: ""});
    const [showBudgetModal, setShowBudgetModal] = useState(false);

    const {monthlySummary, categoryReport} = useSelector((state) => state.dashboard);

    // Fetch reports based on period/custom date
    useEffect(() => {
        const params = {period, type: "expense"};
        if (applyCustomDate && customDates.startDate && customDates.endDate) {
            params.startDate = customDates.startDate;
            params.endDate = customDates.endDate;
        }
        dispatch(getCategoryReport(params));
        dispatch(getMonthlySummary());
    }, [dispatch, period, applyCustomDate, customDates.startDate, customDates.endDate]);

    // Fetch rolling 12 months data directly via Axios (current + prev year)
    const fetchRolling12Months = useCallback(async () => {
        if (!token) return;
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || "/api/v1";
            const currentYear = new Date().getFullYear();
            
            const [resCurr, resPrev] = await Promise.all([
                axios.get(`${API_BASE_URL}/dashboard/monthly-summary?year=${currentYear}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_BASE_URL}/dashboard/monthly-summary?year=${currentYear - 1}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const currentData = resCurr.data?.monthlyData || [];
            const prevData = resPrev.data?.monthlyData || [];
            
            // Merge, sort, and slice to last 12 months
            const merged = [...prevData, ...currentData];
            const sorted = merged.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
            
            setRollingData(sorted.slice(-12));
        } catch (error) {
            console.error("Error fetching rolling data", error);
        }
    }, [token]);

    // Fetch transactions list to run client-side recurring expense detection
    const fetchTransactionsForRecurring = useCallback(async () => {
        if (!token) return;
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || "/api/v1";
            const res = await axios.get(`${API_BASE_URL}/transactions?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAllTransactions(res.data?.transactions || []);
        } catch (error) {
            console.error("Error fetching transactions for recurring check", error);
        }
    }, [token]);

    useEffect(() => {
        fetchRolling12Months();
        fetchTransactionsForRecurring();
    }, [fetchRolling12Months, fetchTransactionsForRecurring]);

    const categoryData = useMemo(() => {
        return (categoryReport?.categories || []).map((item) => ({
            name: item.categoryName,
            value: item.totalAmount,
            percentage: item.percentage,
        }));
    }, [categoryReport]);

    const activeMonthlySummary = useMemo(() => {
        if (!monthlySummary?.monthlyData) return [];
        return monthlySummary.monthlyData.map((item) => ({
            month: item.monthName,
            income: item.totalIncome,
            expense: item.totalExpenses,
            net: item.netBalance,
        }));
    }, [monthlySummary]);

    // MoM Growth, Highest, Lowest, Avg Spending Calculation (Rolling 12 Months)
    const rollingMetrics = useMemo(() => {
        if (!rollingData.length) return {momGrowth: 0, highestMonth: "No Data", lowestMonth: "No Data", avgSpending: 0};
        
        const expenses = rollingData.map((d) => d.totalExpenses);
        const avgSpending = expenses.reduce((sum, val) => sum + val, 0) / rollingData.length;
        
        const maxIdx = expenses.indexOf(Math.max(...expenses));
        const minIdx = expenses.indexOf(Math.min(...expenses));
        const highestMonth = rollingData[maxIdx] ? `${rollingData[maxIdx].monthName} ${rollingData[maxIdx].year}` : "N/A";
        const lowestMonth = rollingData[minIdx] ? `${rollingData[minIdx].monthName} ${rollingData[minIdx].year}` : "N/A";

        // MoM growth percentage
        let momGrowth = 0;
        if (rollingData.length > 1) {
            const last = rollingData[rollingData.length - 1].totalExpenses;
            const prev = rollingData[rollingData.length - 2].totalExpenses;
            if (prev > 0) {
                momGrowth = ((last - prev) / prev) * 100;
            }
        }

        return {
            momGrowth: parseFloat(momGrowth.toFixed(1)),
            highestMonth,
            lowestMonth,
            avgSpending,
        };
    }, [rollingData]);

    // Savings Growth Cumulative (Rolling 12 Months)
    const savingsGrowthData = useMemo(() => {
        let cumulative = 0;
        return rollingData.map((d) => {
            cumulative += (d.totalIncome - d.totalExpenses);
            return {
                month: d.monthName,
                netSavings: d.totalIncome - d.totalExpenses,
                cumulativeSavings: cumulative,
            };
        });
    }, [rollingData]);

    // Category budgets combined with actual reports
    const budgetTrackingList = useMemo(() => {
        const budgets = user?.categoryBudgets || {};
        return (categoryReport?.categories || []).map((item) => {
            const budget = budgets[item.categoryName] || 0;
            const remaining = budget - item.totalAmount;
            const utilization = budget > 0 ? (item.totalAmount / budget) * 100 : 0;
            
            return {
                name: item.categoryName,
                actual: item.totalAmount,
                budget,
                remaining,
                utilization,
                isOverspent: budget > 0 && item.totalAmount > budget,
            };
        });
    }, [categoryReport, user]);

    // Recurring Expense Detection (heuristics: same amount & category on roughly same day)
    const recurringExpenses = useMemo(() => {
        if (!allTransactions.length) return [];
        
        // Filter expenses
        const expenses = allTransactions.filter((t) => t.type === "expense");
        const groups = {};

        // Group by category and rounded amount (or exact amount)
        expenses.forEach((t) => {
            const key = `${t.category}_${t.amount}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(t);
        });

        const detected = [];
        Object.keys(groups).forEach((key) => {
            const items = groups[key];
            if (items.length >= 2) {
                // Check if they happen in consecutive months
                const dates = items.map(i => new Date(i.date)).sort((a,b) => a - b);
                let isMonthly = false;

                for (let i = 0; i < dates.length - 1; i++) {
                    const diffTime = Math.abs(dates[i+1] - dates[i]);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    // Roughly 27 to 33 days apart
                    if (diffDays >= 25 && diffDays <= 35) {
                        isMonthly = true;
                        break;
                    }
                }

                if (isMonthly || items.some(i => i.isRecurring)) {
                    detected.push({
                        category: items[0].category,
                        amount: items[0].amount,
                        frequency: items[0].recurrencePattern || "monthly",
                        description: items[0].description || `Recurring ${items[0].category}`,
                    });
                }
            }
        });

        return detected.slice(0, 5);
    }, [allTransactions]);

    const handleSetBudgetClick = (catName, currentBudget) => {
        setBudgetConfig({category: catName, budget: currentBudget || ""});
        setShowBudgetModal(true);
    };

    const handleSaveBudget = async () => {
        const amount = Number(budgetConfig.budget);
        if (Number.isNaN(amount) || amount < 0) {
            toast.error("Please enter a valid positive number");
            return;
        }

        const updatedBudgets = {
            ...(user?.categoryBudgets || {}),
            [budgetConfig.category]: amount,
        };

        try {
            await dispatch(updateProfile({categoryBudgets: updatedBudgets})).unwrap();
            setShowBudgetModal(false);
            toast.success(`Budget for ${budgetConfig.category} updated to ${formatCurrency(amount)}`);
        } catch (error) {
            toast.error("Failed to update category budget");
        }
    };

    const exportCsvReport = () => {
        const rows = [
            ["Category", "Budget Limit", "Actual Spend", "Remaining", "Utilization %"],
            ...budgetTrackingList.map((item) => [
                item.name,
                item.budget || "Not Set",
                item.actual,
                item.budget ? item.remaining : "N/A",
                item.budget ? `${item.utilization.toFixed(1)}%` : "N/A",
            ]),
        ];
        
        let csvContent = "data:text/csv;charset=utf-8,";
        rows.forEach((row) => {
            csvContent += row.map((val) => `"${val}"`).join(",") + "\r\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "budget_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Report Downloaded");
    };

    const handlePrintPdf = () => {
        window.print();
    };

    return (
        <AppShell title="Advanced Reports">
            {showBudgetModal && (
                <div className="cropper-modal-overlay">
                    <div className="cropper-modal-content finance-card confirm-modal">
                        <h3>Configure Category Budget</h3>
                        <p className="eyebrow">Set limits for: {budgetConfig.category}</p>
                        <label className="form-label" style={{marginTop: "1rem"}}>
                            Monthly Limit Amount
                            <input
                                type="number"
                                min="0"
                                value={budgetConfig.budget}
                                onChange={(e) => setBudgetConfig({...budgetConfig, budget: e.target.value})}
                                placeholder="0.00"
                                style={{marginTop: "0.5rem"}}
                            />
                        </label>
                        <div className="modal-actions" style={{marginTop: "1.5rem"}}>
                            <button type="button" className="ghost-button" onClick={() => setShowBudgetModal(false)}>
                                Cancel
                            </button>
                            <button type="button" className="primary-button" onClick={handleSaveBudget}>
                                Save Budget Limit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and Print bar */}
            <section className="report-header finance-card print-hide">
                <div className="toolbar-reports">
                    <div className="filter-group">
                        <select value={period} onChange={(e) => { setPeriod(e.target.value); setApplyCustomDate(false); }}>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    <div className="custom-date-picker">
                        <input
                            type="date"
                            value={customDates.startDate}
                            onChange={(e) => setCustomDates({...customDates, startDate: e.target.value})}
                            aria-label="Start date"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={customDates.endDate}
                            onChange={(e) => setCustomDates({...customDates, endDate: e.target.value})}
                            aria-label="End date"
                        />
                        <button
                            type="button"
                            className="primary-button"
                            onClick={() => setApplyCustomDate(true)}
                            disabled={!customDates.startDate || !customDates.endDate}
                        >
                            Filter Dates
                        </button>
                    </div>

                    <div className="action-buttons-group">
                        <button type="button" className="ghost-button" onClick={exportCsvReport}>
                            Export CSV
                        </button>
                        <button type="button" className="primary-button print-trigger-btn" onClick={handlePrintPdf}>
                            🖨️ Export PDF
                        </button>
                    </div>
                </div>
            </section>

            {/* Print Only Header */}
            <div className="print-only print-header">
                <h2>Expense Management System - Financial Report</h2>
                <p>Generated on: {new Date().toLocaleDateString()} for user: {user?.name}</p>
                <p>Filter Period: {applyCustomDate ? `${customDates.startDate} to ${customDates.endDate}` : period.toUpperCase()}</p>
            </div>

            {/* 12 Months Metrics KPIs */}
            <section className="kpi-grid compact">
                <div className="finance-card">
                    <p className="eyebrow">MoM Trend (Rolling)</p>
                    <strong className={`metric-large ${rollingMetrics.momGrowth > 0 ? "amount-negative" : "amount-positive"}`}>
                        {rollingMetrics.momGrowth > 0 ? "+" : ""}{rollingMetrics.momGrowth}%
                    </strong>
                    <span className="kpi-detail">Expenses MoM change</span>
                </div>
                <div className="finance-card">
                    <p className="eyebrow">12M Average Monthly Spend</p>
                    <strong className="metric-large">{formatCurrency(rollingMetrics.avgSpending)}</strong>
                    <span className="kpi-detail">Based on rolling data</span>
                </div>
                <div className="finance-card">
                    <p className="eyebrow">Highest Spending Month</p>
                    <strong className="metric-large">{rollingMetrics.highestMonth}</strong>
                    <span className="kpi-detail">Peak month recorded</span>
                </div>
                <div className="finance-card">
                    <p className="eyebrow">Lowest Spending Month</p>
                    <strong className="metric-large">{rollingMetrics.lowestMonth}</strong>
                    <span className="kpi-detail">Optimal thrift month</span>
                </div>
            </section>

            {/* Advanced Charts Grid */}
            <section className="chart-grid">
                {/* Line Chart - Monthly Spending Trend */}
                <ChartCard title="Monthly Spending Trend" subtitle="Expense movement over rolling 12 months">
                    {rollingData.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={rollingData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="monthName" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Line type="monotone" dataKey="totalExpenses" name="Spent" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No rolling trend data available" />
                    )}
                </ChartCard>

                {/* Area Chart - Savings Growth */}
                <ChartCard title="Net & Cumulative Savings" subtitle="Accumulated wealth growth over time">
                    {savingsGrowthData.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={savingsGrowthData}>
                                <defs>
                                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Area type="monotone" dataKey="cumulativeSavings" name="Total Savings" stroke="#6366f1" fillOpacity={1} fill="url(#colorSavings)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No cumulative data available" />
                    )}
                </ChartCard>

                {/* Bar Chart - Cash Flow */}
                <ChartCard title="Income vs Expense comparison" subtitle="Cash flow structure">
                    {activeMonthlySummary.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={activeMonthlySummary}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="income" name="Income" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No monthly summary data" />
                    )}
                </ChartCard>

                {/* Pie Chart - Share Breakdown */}
                <ChartCard title="Category Breakdown" subtitle="Share of actual spending this period">
                    {categoryData.length ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2} label>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState title="No category share details" />
                    )}
                </ChartCard>
            </section>

            {/* Budget Compliance & Recurring Expenses */}
            <section className="insight-grid">
                {/* Budget Tracking Compliance list */}
                <div className="finance-card">
                    <h3 className="section-title">Category Budget Compliance</h3>
                    <p className="eyebrow" style={{marginBottom: "1rem"}}>Set budget caps and track limits</p>
                    
                    {budgetTrackingList.length ? (
                        <div className="budget-compliance-list">
                            {budgetTrackingList.map((item) => (
                                <div key={item.name} className="budget-compliance-item">
                                    <div className="compliance-meta">
                                        <strong>{item.name}</strong>
                                        <span onClick={() => handleSetBudgetClick(item.name, item.budget)} className="budget-tag-interactive">
                                            {item.budget > 0 ? `Budget: ${formatCurrency(item.budget)}` : "Set Limit ⚙️"}
                                        </span>
                                    </div>
                                    <div className="compliance-fill-wrapper">
                                        <div className="progress-track">
                                            <div
                                                className={`progress-fill ${item.isOverspent ? "danger" : ""}`}
                                                style={{width: `${Math.min(item.utilization, 100)}%`}}
                                            />
                                        </div>
                                        <div className="utilization-label">
                                            <span>{formatCurrency(item.actual)} spent</span>
                                            <span className={item.isOverspent ? "alert-text" : ""}>
                                                {item.isOverspent ? `Overspent by ${formatCurrency(Math.abs(item.remaining))}` : `${item.utilization.toFixed(0)}% used`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No categories found to configure limits" />
                    )}
                </div>

                {/* Recurring Expense Detection */}
                <div className="finance-card">
                    <h3 className="section-title">Detected Recurring Expenses</h3>
                    <p className="eyebrow" style={{marginBottom: "1rem"}}>Automatically matched bills & subscriptions</p>
                    
                    {recurringExpenses.length ? (
                        <div className="recurring-list">
                            {recurringExpenses.map((expense, idx) => (
                                <div key={idx} className="recurring-item">
                                    <div className="recurring-header">
                                        <span className="subscription-icon">🔄</span>
                                        <div>
                                            <h4>{expense.description}</h4>
                                            <span>Category: {expense.category}</span>
                                        </div>
                                    </div>
                                    <div className="recurring-details">
                                        <strong>{formatCurrency(expense.amount)}</strong>
                                        <span className="recurrence-pill">{expense.frequency}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No recurring patterns detected" message="Subscriptions and standing bills will appear once logged monthly." />
                    )}
                </div>
            </section>
        </AppShell>
    );
};

export default Reports;
