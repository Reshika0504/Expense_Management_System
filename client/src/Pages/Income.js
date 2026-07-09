import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import toast from "react-hot-toast";
import AppShell from "../Components/AppShell";
import EmptyState from "../Components/ui/EmptyState";
import Skeleton from "../Components/ui/Skeleton";
import KpiCard from "../Components/ui/KpiCard";
import {createTransaction, deleteTransaction, getTransactions, updateTransaction} from "../redux/slices/transactionSlice";
import {getCategories} from "../redux/slices/categorySlice";
import {getDashboardOverview, getMonthlySummary} from "../redux/slices/dashboardSlice";
import {downloadCsv, formatCurrency} from "../utils/finance";

const initialForm = {
    type: "income",
    category: "Salary",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    paymentMethod: "bank_transfer",
};

const Income = () => {
    const dispatch = useDispatch();
    const {transactions, pagination, loading} = useSelector((state) => state.transactions);
    const {categories} = useSelector((state) => state.categories);
    const {overview, monthlySummary} = useSelector((state) => state.dashboard);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 8,
        search: "",
        type: "income",
        sortBy: "date",
        sortOrder: "desc",
    });

    useEffect(() => {
        dispatch(getCategories({type: "income"}));
        dispatch(getDashboardOverview());
        dispatch(getMonthlySummary());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getTransactions(filters));
    }, [dispatch, filters]);

    const incomeCategories = useMemo(() => {
        const list = categories.filter((c) => c.type === "income");
        return list.length > 0 ? list : [
            {name: "Salary"},
            {name: "Freelance"},
            {name: "Bonus"},
            {name: "Investments"},
            {name: "Other"}
        ];
    }, [categories]);

    // Compute summaries
    const monthlyIncome = useMemo(() => {
        return overview?.currentMonth?.totalIncome ?? 0;
    }, [overview]);

    const yearlyIncome = useMemo(() => {
        if (!monthlySummary?.monthlyData) return 0;
        return monthlySummary.monthlyData.reduce((sum, item) => sum + item.totalIncome, 0);
    }, [monthlySummary]);

    const averageIncome = useMemo(() => {
        const incomeList = transactions.filter(t => t.type === "income");
        if (!incomeList.length) return 0;
        const total = incomeList.reduce((sum, t) => sum + t.amount, 0);
        return total / incomeList.length;
    }, [transactions]);

    const updateFilter = (name, value) => {
        setFilters((current) => ({
            ...current,
            [name]: value,
            page: name === "page" ? value : 1,
        }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        const payload = {
            ...form,
            amount: Number(form.amount),
            date: new Date(form.date).toISOString(),
        };

        try {
            if (editingId) {
                await dispatch(updateTransaction({id: editingId, data: payload})).unwrap();
                toast.success("Income transaction updated");
            } else {
                await dispatch(createTransaction(payload)).unwrap();
                toast.success("Income transaction added");
            }
            setForm(initialForm);
            setEditingId(null);
            dispatch(getTransactions(filters));
            dispatch(getDashboardOverview());
            dispatch(getMonthlySummary());
        } catch (error) {
            toast.error(error || "Failed to save income");
        }
    };

    const editTransaction = (transaction) => {
        setEditingId(transaction._id);
        setForm({
            type: "income",
            category: transaction.category,
            amount: transaction.amount,
            date: new Date(transaction.date).toISOString().slice(0, 10),
            description: transaction.description || "",
            paymentMethod: transaction.paymentMethod || "bank_transfer",
        });
    };

    const removeTransaction = async (id) => {
        try {
            await dispatch(deleteTransaction(id)).unwrap();
            toast.success("Income transaction deleted");
            dispatch(getTransactions(filters));
            dispatch(getDashboardOverview());
            dispatch(getMonthlySummary());
        } catch (error) {
            toast.error(error || "Failed to delete transaction");
        }
    };

    const exportCsv = () => {
        downloadCsv(
            [
                ["Date", "Category", "Description", "Amount", "Payment Method"],
                ...transactions.map((transaction) => [
                    new Date(transaction.date).toLocaleDateString(),
                    transaction.category,
                    transaction.description || "",
                    transaction.amount,
                    transaction.paymentMethod || "",
                ]),
            ],
            "income_transactions.csv"
        );
        toast.success("CSV exported");
    };

    return (
        <AppShell title="Income Management">
            <section className="kpi-grid">
                <KpiCard label="Monthly Income" value={formatCurrency(monthlyIncome)} detail="Current calendar month total" accent="teal" icon="💰" />
                <KpiCard label="Yearly Income" value={formatCurrency(yearlyIncome)} detail="Current calendar year total" accent="indigo" icon="📅" />
                <KpiCard label="Average Deposit" value={formatCurrency(averageIncome)} detail="Across current filtered items" accent="amber" icon="📈" />
            </section>

            <section className="finance-card transaction-workspace">
                <form className="transaction-form" onSubmit={onSubmit}>
                    <div className="form-header">
                        <div>
                            <p className="eyebrow">{editingId ? "Update income" : "New deposit"}</p>
                            <h3>{editingId ? "Edit income transaction" : "Add new income source"}</h3>
                        </div>
                        {editingId && (
                            <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                                Cancel
                            </button>
                        )}
                    </div>
                    <div className="form-grid">
                        <label>
                            Category
                            <select
                                value={form.category}
                                onChange={(event) => setForm({...form, category: event.target.value})}
                                required
                            >
                                {incomeCategories.map((c) => (
                                    <option value={c.name} key={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Amount
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.amount}
                                onChange={(event) => setForm({...form, amount: event.target.value})}
                                placeholder="0.00"
                                required
                            />
                        </label>
                        <label>
                            Date
                            <input type="date" value={form.date} onChange={(event) => setForm({...form, date: event.target.value})} required />
                        </label>
                        <label>
                            Deposit Method
                            <select value={form.paymentMethod} onChange={(event) => setForm({...form, paymentMethod: event.target.value})}>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="digital_wallet">Digital Wallet</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label className="form-span">
                            Description / Notes
                            <input
                                value={form.description}
                                onChange={(event) => setForm({...form, description: event.target.value})}
                                placeholder="Salary pay stub, freelance milestone, bonus payment..."
                            />
                        </label>
                    </div>
                    <button type="submit" className="primary-button">
                        {editingId ? "Save changes" : "Add income"}
                    </button>
                </form>
            </section>

            <section className="finance-card">
                <div className="toolbar">
                    <input
                        aria-label="Search income"
                        placeholder="Search category, notes, description..."
                        value={filters.search}
                        onChange={(event) => updateFilter("search", event.target.value)}
                    />
                    <select
                        value={filters.category}
                        onChange={(event) => updateFilter("category", event.target.value)}
                    >
                        <option value="">All Categories</option>
                        {incomeCategories.map((c) => (
                            <option value={c.name} key={c.name}>{c.name}</option>
                        ))}
                    </select>
                    <select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value)}>
                        <option value="date">Sort by date</option>
                        <option value="amount">Sort by amount</option>
                    </select>
                    <select value={filters.sortOrder} onChange={(event) => updateFilter("sortOrder", event.target.value)}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                    <button type="button" className="ghost-button" onClick={exportCsv} disabled={!transactions.length}>
                        Export CSV
                    </button>
                </div>

                {loading ? (
                    <Skeleton rows={5} />
                ) : transactions.length ? (
                    <div className="responsive-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id}>
                                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className="pill income">{transaction.category}</span>
                                        </td>
                                        <td>{transaction.description || "No description"}</td>
                                        <td className="amount-positive">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                        <td>{(transaction.paymentMethod || "bank_transfer").replace("_", " ").toUpperCase()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button type="button" onClick={() => editTransaction(transaction)}>
                                                    Edit
                                                </button>
                                                <button type="button" onClick={() => removeTransaction(transaction._id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState title="No income transactions found" message="Add your first income transaction to see details here." />
                )}

                <div className="pagination-row">
                    <span>
                        Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
                    </span>
                    <div>
                        <button type="button" disabled={!pagination.hasPrevPage} onClick={() => updateFilter("page", filters.page - 1)}>
                            Previous
                        </button>
                        <button type="button" disabled={!pagination.hasNextPage} onClick={() => updateFilter("page", filters.page + 1)}>
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </AppShell>
    );
};

export default Income;
