import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import api, {apiErrorMessage} from "../../services/api";


// Initial state
const initialState = {
    categories: [],
    systemCategories: [],
    loading: false,
    error: null,
    stats: null,
};

// Async thunks
export const getCategories = createAsyncThunk(
    "categories/fetchAll",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await api.get(`/categories?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.categories;
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to fetch categories"));
        }
    }
);

export const getSystemCategories = createAsyncThunk(
    "categories/fetchSystem",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await api.get(`/categories/system?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.categories;
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to fetch system categories"));
        }
    }
);

export const createCategory = createAsyncThunk(
    "categories/create",
    async (categoryData, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const response = await api.post(`/categories`, categoryData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.category;
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to create category"));
        }
    }
);

export const updateCategory = createAsyncThunk("categories/update", async ({id, data}, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        const response = await api.put(`/categories/${id}`, data, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return response.data.category;
    } catch (error) {
        return rejectWithValue(apiErrorMessage(error, "Failed to update category"));
    }
});

export const deleteCategory = createAsyncThunk("categories/delete", async (id, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        await api.delete(`/categories/${id}`, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return id;
    } catch (error) {
        return rejectWithValue(apiErrorMessage(error, "Failed to delete category"));
    }
});

export const getCategoryStats = createAsyncThunk(
    "categories/stats",
    async (params = {}, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const queryParams = new URLSearchParams(params).toString();
            const response = await api.get(`/categories/stats/usage?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.stats;
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to fetch category stats"));
        }
    }
);

const categorySlice = createSlice({
    name: "categories",
    initialState,
    reducers: {
        clearCategories: (state) => {
            state.categories = [];
            state.systemCategories = [];
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        // Get all categories
        .addCase(getCategories.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getCategories.fulfilled, (state, action) => {
            state.loading = false;
            state.categories = action.payload;
        })
        .addCase(getCategories.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get system categories
        .addCase(getSystemCategories.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getSystemCategories.fulfilled, (state, action) => {
            state.loading = false;
            state.systemCategories = action.payload;
        })
        .addCase(getSystemCategories.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Create category
        .addCase(createCategory.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createCategory.fulfilled, (state, action) => {
            state.loading = false;
            state.categories.push(action.payload);
        })
        .addCase(createCategory.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Update category
        .addCase(updateCategory.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateCategory.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.categories.findIndex((c) => c._id === action.payload._id);
            if (index !== -1) {
                state.categories[index] = action.payload;
            }
        })
        .addCase(updateCategory.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Delete category
        .addCase(deleteCategory.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteCategory.fulfilled, (state, action) => {
            state.loading = false;
            state.categories = state.categories.filter((c) => c._id !== action.payload);
        })
        .addCase(deleteCategory.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get category stats
        .addCase(getCategoryStats.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getCategoryStats.fulfilled, (state, action) => {
            state.loading = false;
            state.stats = action.payload;
        })
        .addCase(getCategoryStats.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const {clearCategories, clearError} = categorySlice.actions;
export default categorySlice.reducer;
