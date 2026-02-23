import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/v1";

// Initial state
const initialState = {
    transactions: [],
    loading: false,
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
    },
    stats: null,
};

// Async thunks
export const createTransaction = createAsyncThunk(
    "transactions/create",
    async (transactionData, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.transaction;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create transaction");
        }
    }
);

export const getTransactions = createAsyncThunk(
    "transactions/fetchAll",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_BASE_URL}/transactions?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch transactions");
        }
    }
);

export const getTransaction = createAsyncThunk("transactions/fetchOne", async (id, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        const response = await axios.get(`${API_BASE_URL}/transactions/${id}`, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return response.data.transaction;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch transaction");
    }
});

export const updateTransaction = createAsyncThunk(
    "transactions/update",
    async ({id, data}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const response = await axios.put(`${API_BASE_URL}/transactions/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.transaction;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update transaction");
        }
    }
);

export const deleteTransaction = createAsyncThunk("transactions/delete", async (id, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        await axios.delete(`${API_BASE_URL}/transactions/${id}`, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to delete transaction");
    }
});

export const getTransactionStats = createAsyncThunk(
    "transactions/stats",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_BASE_URL}/transactions/stats/summary?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.stats;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch transaction stats");
        }
    }
);

const transactionSlice = createSlice({
    name: "transactions",
    initialState,
    reducers: {
        clearTransactions: (state) => {
            state.transactions = [];
            state.pagination = initialState.pagination;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        // Create transaction
        .addCase(createTransaction.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createTransaction.fulfilled, (state, action) => {
            state.loading = false;
            state.transactions.unshift(action.payload);
        })
        .addCase(createTransaction.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get transactions
        .addCase(getTransactions.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getTransactions.fulfilled, (state, action) => {
            state.loading = false;
            state.transactions = action.payload.transactions;
            state.pagination = action.payload.pagination;
        })
        .addCase(getTransactions.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get single transaction
        .addCase(getTransaction.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getTransaction.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.transactions.findIndex((t) => t._id === action.payload._id);
            if (index !== -1) {
                state.transactions[index] = action.payload;
            } else {
                state.transactions.push(action.payload);
            }
        })
        .addCase(getTransaction.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Update transaction
        .addCase(updateTransaction.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateTransaction.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.transactions.findIndex((t) => t._id === action.payload._id);
            if (index !== -1) {
                state.transactions[index] = action.payload;
            }
        })
        .addCase(updateTransaction.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Delete transaction
        .addCase(deleteTransaction.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteTransaction.fulfilled, (state, action) => {
            state.loading = false;
            state.transactions = state.transactions.filter((t) => t._id !== action.payload);
        })
        .addCase(deleteTransaction.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get transaction stats
        .addCase(getTransactionStats.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getTransactionStats.fulfilled, (state, action) => {
            state.loading = false;
            state.stats = action.payload;
        })
        .addCase(getTransactionStats.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const {clearTransactions, clearError} = transactionSlice.actions;
export default transactionSlice.reducer;
