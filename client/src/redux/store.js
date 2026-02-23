import {configureStore} from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import transactionSlice from "./slices/transactionSlice";
import categorySlice from "./slices/categorySlice";
import dashboardSlice from "./slices/dashboardSlice";

export const store = configureStore({
    reducer: {
        auth: authSlice,
        transactions: transactionSlice,
        categories: categorySlice,
        dashboard: dashboardSlice,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
            },
        }),
});
