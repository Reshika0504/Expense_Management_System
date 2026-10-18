import {createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import api, {apiErrorMessage} from "../../services/api";


// Initial state
const initialState = {
    user: null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    profileStatus: "idle",
    error: null,
};

// Server acknowledgement is required before calling logout successful.
export const logoutUser = createAsyncThunk("auth/logoutUser", async (_, { getState, dispatch, rejectWithValue }) => {
    const token = getState().auth.token;
    try {
        if (token) await api.post("/users/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
        dispatch(logout());
        return true;
    } catch (error) {
        dispatch(logout()); // Device privacy must not depend on the network being available.
        if ([401, 403].includes(error.response?.status)) return true;
        return rejectWithValue(
            "Signed out on this device. We could not confirm server session revocation. Reconnect and sign in to end other sessions.",
        );
    }
});

// Async thunks
export const firebaseLogin = createAsyncThunk("auth/firebase", async (credentials, {rejectWithValue}) => {
    try {
        const response = await api.post(`/users/firebase`, credentials);
        const {token, user} = response.data;
        localStorage.setItem("token", token);
        return {token, user};
    } catch (error) {
        return rejectWithValue(apiErrorMessage(error, "Unable to finish sign-in. Please try again."));
    }
});

export const loginUser = createAsyncThunk("auth/login", async (credentials, {rejectWithValue}) => {
    try {
        const response = await api.post(`/users/login`, credentials);
        const {token, user} = response.data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        return {token, user};
    } catch (error) {
        return rejectWithValue(apiErrorMessage(error, "Login failed"));
    }
});

export const registerUser = createAsyncThunk("auth/register", async (userData, {rejectWithValue}) => {
    try {
        const response = await api.post(`/users/register`, userData);
        const {token, user} = response.data;

        // Store token in localStorage
        localStorage.setItem("token", token);

        return {token, user};
    } catch (error) {
        return rejectWithValue(apiErrorMessage(error, "Registration failed"));
    }
});

export const getProfile = createAsyncThunk("auth/getProfile", async (_, {getState, rejectWithValue}) => {
    try {
        const {auth} = getState();
        const response = await api.get(`/users/profile`, {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        });
        return response.data.user;
    } catch (error) {
        return rejectWithValue({message: apiErrorMessage(error, "Could not load your profile. Please retry."), status: error.response?.status});
    }
});

export const updateProfile = createAsyncThunk(
    "auth/updateProfile",
    async (profileData, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const response = await api.put(`/users/profile`, profileData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.user;
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to update profile"));
        }
    }
);

export const changePassword = createAsyncThunk(
    "auth/changePassword",
    async (passwordData, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            await api.put(`/users/change-password`, passwordData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return "Password changed successfully";
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to change password"));
        }
    }
);

export const deleteAccount = createAsyncThunk(
    "auth/deleteAccount",
    async (_, {getState, rejectWithValue}) => {
        try {
            const {auth} = getState();
            const response = await api.delete(`/users/profile`, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                },
            });
            return response.data.message;
        } catch (error) {
            return rejectWithValue(apiErrorMessage(error, "Failed to delete account"));
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
            state.profileStatus = "idle";
            state.error = null;
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
        .addCase(firebaseLogin.pending, (state) => { state.loading = true; state.error = null; })
        .addCase(firebaseLogin.fulfilled, (state, action) => {
            state.loading = false; state.user = action.payload.user; state.token = action.payload.token; state.isAuthenticated = true;
        })
        .addCase(firebaseLogin.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
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
            state.profileStatus = "loading";
            state.error = null;
        })
        .addCase(getProfile.fulfilled, (state, action) => {
            state.profileStatus = "succeeded";
            state.user = action.payload;
        })
        .addCase(getProfile.rejected, (state, action) => {
            state.profileStatus = "failed";
            state.error = action.payload?.message;
            if ([401, 403, 404].includes(action.payload?.status)) {
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
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
        })
        .addCase(changePassword.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })

        // Delete Account
        .addCase(deleteAccount.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteAccount.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
        })
        .addCase(deleteAccount.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});

export const {logout, clearError, setCredentials} = authSlice.actions;
export default authSlice.reducer;
