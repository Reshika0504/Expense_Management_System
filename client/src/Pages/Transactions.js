import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import toast from "react-hot-toast";
import AppShell from "../Components/AppShell";
import EmptyState from "../Components/ui/EmptyState";
import Skeleton from "../Components/ui/Skeleton";
import {createTransaction, deleteTransaction, getTransactions, updateTransaction} from "../redux/slices/transactionSlice";
import {getCategories} from "../redux/slices/categorySlice";
import {downloadCsv, formatCurrency} from "../utils/finance";

const initialForm = {
    type: "expense",
    category: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    paymentMethod: "other",
};

const Transactions = () => {
    const dispatch = useDispatch();
    const {transactions, pagination, loading} = useSelector((state) => state.transactions);
    const {categories} = useSelector((state) => state.categories);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 8,
        search: "",
        type: "",
        sortBy: "date",
        sortOrder: "desc",
    });

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getTransactions(filters));
    }, [dispatch, filters]);

    const categoryOptions = useMemo(() => categories.map((category) => category.name), [categories]);

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
                toast.success("Transaction updated");
            } else {
                await dispatch(createTransaction(payload)).unwrap();
                toast.success("Transaction added");
            }
            setForm(initialForm);
            setEditingId(null);
            dispatch(getTransactions(filters));
        } catch (error) {
            toast.error(error || "Failed to save transaction");
        }
    };

    const editTransaction = (transaction) => {
        setEditingId(transaction._id);
        setForm({
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            date: new Date(transaction.date).toISOString().slice(0, 10),
            description: transaction.description || "",
            paymentMethod: transaction.paymentMethod || "other",
        });
    };

    const removeTransaction = async (id) => {
        try {
            await dispatch(deleteTransaction(id)).unwrap();
            toast.success("Transaction deleted");
            dispatch(getTransactions(filters));
        } catch (error) {
            toast.error(error || "Failed to delete transaction");
        }
    };

    const exportCsv = () => {
        downloadCsv(
            [
                ["Date", "Type", "Category", "Description", "Amount", "Payment Method"],
                ...transactions.map((transaction) => [
                    new Date(transaction.date).toLocaleDateString(),
                    transaction.type,
                    transaction.category,
                    transaction.description || "",
                    transaction.amount,
                    transaction.paymentMethod || "",
                ]),
            ],
            "transactions.csv"
        );
        toast.success("CSV exported");
    };

    return (
        <AppShell title="Transactions">
            <section className="finance-card transaction-workspace">
                <form className="transaction-form" onSubmit={onSubmit}>
                    <div className="form-header">
                        <div>
                            <p className="eyebrow">{editingId ? "Update entry" : "New entry"}</p>
                            <h3>{editingId ? "Edit transaction" : "Add transaction"}</h3>
                        </div>
                        {editingId && (
                            <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                                Cancel
                            </button>
                        )}
                    </div>
                    <div className="form-grid">
                        <label>
                            Type
                            <select value={form.type} onChange={(event) => setForm({...form, type: event.target.value})}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </label>
                        <label>
                            Category
                            <input
                                list="category-options"
                                value={form.category}
                                onChange={(event) => setForm({...form, category: event.target.value})}
                                required
                            />
                            <datalist id="category-options">
                                {categoryOptions.map((category) => (
                                    <option value={category} key={category} />
                                ))}
                            </datalist>
                        </label>
                        <label>
                            Amount
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.amount}
                                onChange={(event) => setForm({...form, amount: event.target.value})}
                                required
                            />
                        </label>
                        <label>
                            Date
                            <input type="date" value={form.date} onChange={(event) => setForm({...form, date: event.target.value})} required />
                        </label>
                        <label>
                            Payment Method
                            <select value={form.paymentMethod} onChange={(event) => setForm({...form, paymentMethod: event.target.value})}>
                                <option value="cash">Cash</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="digital_wallet">Digital Wallet</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label className="form-span">
                            Description
                            <input value={form.description} onChange={(event) => setForm({...form, description: event.target.value})} />
                        </label>
                    </div>
                    <button type="submit" className="primary-button">
                        {editingId ? "Save changes" : "Add transaction"}
                    </button>
                </form>
            </section>

            <section className="finance-card">
                <div className="toolbar">
                    <input
                        aria-label="Search transactions"
                        placeholder="Search category, notes, description..."
                        value={filters.search}
                        onChange={(event) => updateFilter("search", event.target.value)}
                    />
                    <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
                        <option value="">All types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                    <select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value)}>
                        <option value="date">Sort by date</option>
                        <option value="amount">Sort by amount</option>
                        <option value="category">Sort by category</option>
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
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction._id}>
                                        <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`pill ${transaction.type}`}>{transaction.type}</span>
                                        </td>
                                        <td>{transaction.category}</td>
                                        <td>{transaction.description || "No description"}</td>
                                        <td className={transaction.type === "income" ? "amount-positive" : "amount-negative"}>
                                            {formatCurrency(transaction.amount)}
                                        </td>
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
                    <EmptyState title="No transactions found" message="Try a different search or add your first transaction." />
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

export default Transactions;
