import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api/v1";

// Initial state
const initialState = {
    overview: null,
    monthlySummary: null,
    categoryReport: null,
    topCategories: null,
    loading: false,
    error: null,
};

// Async thunks
export const getDashboardOverview = createAsyncThunk("dashboard/overview", async (_, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        const response = await axios.get(`${API_BASE_URL}/dashboard/overview`, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return response.data.overview;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard overview");
    }
});

export const getMonthlySummary = createAsyncThunk(
    "dashboard/monthlySummary",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_BASE_URL}/dashboard/monthly-summary?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch monthly summary");
        }
    }
);

export const getCategoryReport = createAsyncThunk(
    "dashboard/categoryReport",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_BASE_URL}/dashboard/category-report?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch category report");
        }
    }
);

export const getTopCategories = createAsyncThunk(
    "dashboard/topCategories",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await axios.get(`${API_BASE_URL}/dashboard/top-categories?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.topCategories;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch top categories");
        }
    }
);

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        clearDashboard: (state) => {
            state.overview = null;
            state.monthlySummary = null;
            state.categoryReport = null;
            state.topCategories = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        // Dashboard overview
        .addCase(getDashboardOverview.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getDashboardOverview.fulfilled, (state, action) => {
            state.loading = false;
            state.overview = action.payload;
        })
        .addCase(getDashboardOverview.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Monthly summary
        .addCase(getMonthlySummary.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getMonthlySummary.fulfilled, (state, action) => {
            state.loading = false;
            state.monthlySummary = action.payload;
        })
        .addCase(getMonthlySummary.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Category report
        .addCase(getCategoryReport.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getCategoryReport.fulfilled, (state, action) => {
            state.loading = false;
            state.categoryReport = action.payload;
        })
        .addCase(getCategoryReport.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Top categories
        .addCase(getTopCategories.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getTopCategories.fulfilled, (state, action) => {
            state.loading = false;
            state.topCategories = action.payload;
        })
        .addCase(getTopCategories.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const {clearDashboard, clearError} = dashboardSlice.actions;
export default dashboardSlice.reducer;
