import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api/v1";

// Initial state
const initialState = {
    user: null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
};

// Async thunks
export const loginUser = createAsyncThunk("auth/login", async (credentials, {rejectWithValue}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, credentials);
        const {token, user} = response.data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        return {token, user};
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Login failed");
    }
});

export const registerUser = createAsyncThunk("auth/register", async (userData, {rejectWithValue}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/register`, userData);
        const {token, user} = response.data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        return {token, user};
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
});

export const getProfile = createAsyncThunk("auth/getProfile", async (_, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        const response = await axios.get(`${API_BASE_URL}/users/profile`, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return response.data.user;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
    }
});

export const updateProfile = createAsyncThunk(
    "auth/updateProfile",
    async (profileData, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const response = await axios.put(`${API_BASE_URL}/users/profile`, profileData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update profile");
        }
    }
);

export const changePassword = createAsyncThunk(
    "auth/changePassword",
    async (passwordData, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            await axios.put(`${API_BASE_URL}/users/change-password`, passwordData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return "Password changed successfully";
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to change password");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
        },
        clearError: (state) => {
            state.error = null;
        },
        setCredentials: (state, action) => {
            const {user, token} = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        builder
        // Login
        .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        })
        .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Register
        .addCase(registerUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(registerUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        })
        .addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Get Profile
        .addCase(getProfile.pending, (state) => {
            state.loading = true;
        })
        .addCase(getProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(getProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
            if (action.payload === "Not authorized, token failed" || action.payload === "Not authorized, no token") {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem("token");
            }
        })

        // Update Profile
        .addCase(updateProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
        .addCase(updateProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Change Password
        .addCase(changePassword.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(changePassword.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(changePassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const {logout, clearError, setCredentials} = authSlice.actions;
export default authSlice.reducer;
