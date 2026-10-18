import {configureStore, combineReducers} from "@reduxjs/toolkit";
import {createSessionGuard} from './sessionGuard';
import authSlice from "./slices/authSlice";
import transactionSlice from "./slices/transactionSlice";
import categorySlice from "./slices/categorySlice";
import dashboardSlice from "./slices/dashboardSlice";

const reducers=combineReducers({auth:authSlice,transactions:transactionSlice,categories:categorySlice,dashboard:dashboardSlice});
export const rootReducer=(state,action)=>{
    const ended=action.type==='auth/logout' || action.type==='auth/changePassword/fulfilled' || action.type==='auth/deleteAccount/fulfilled' || (action.type==='auth/getProfile/rejected' && [401,403,404].includes(action.payload?.status));
    if(ended && state)state={auth:state.auth};
    return reducers(state,action);
};
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
            },
        }).concat(createSessionGuard()),
});
