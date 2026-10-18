import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logoutUser, changePassword } from "./authSlice";
import api from "../../services/api";
import { createSessionGuard } from "../sessionGuard";
import { rootReducer } from "../store";
jest.mock("../../services/api", () => ({
    __esModule: true,
    default: { post: jest.fn() },
    apiErrorMessage: (_e, fallback) => fallback,
}));
const session = {
    user: { id: "synthetic-user" },
    token: "synthetic-token",
    isAuthenticated: true,
    loading: false,
    profileStatus: "succeeded",
    error: null,
};
afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});
test("logout calls the authenticated server endpoint before clearing session and private state", async () => {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: {
            auth: session,
            transactions: {
                transactions: [{ amount: 55 }],
                loading: false,
                pagination: {},
                stats: null,
            },
        },
    });
    localStorage.setItem("token", session.token);
    let resolve;
    api.post.mockImplementation(
        () =>
            new Promise((r) => {
                resolve = r;
            }),
    );
    const pending = store.dispatch(logoutUser());
    expect(store.getState().auth.token).toBe(session.token);
    expect(api.post).toHaveBeenCalledWith(
        "/users/logout",
        {},
        { headers: { Authorization: "Bearer synthetic-token" } },
    );
    resolve({ data: { success: true } });
    await pending.unwrap();
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().transactions.transactions).toEqual([]);
    expect(localStorage.getItem("token")).toBeNull();
});
test("offline logout clears this device without pretending that server revocation succeeded", async () => {
    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: session },
    });
    api.post.mockRejectedValue(new Error("offline"));
    await expect(store.dispatch(logoutUser()).unwrap()).rejects.toMatch(/could not confirm server session revocation/);
    expect(store.getState().auth.token).toBeNull();
});
test("a server-revoked session clears local state and password changes require re-login", async () => {
    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: session },
    });
    api.post.mockRejectedValue({ response: { status: 401 } });
    await store.dispatch(logoutUser()).unwrap();
    expect(store.getState().auth.token).toBeNull();
    expect(authReducer(session, changePassword.fulfilled("changed", "request")).token).toBeNull();
});

test("late finance response from a previous account cannot refill the next account cache", () => {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: { auth: session },
        middleware: (g) => g().concat(createSessionGuard()),
    });
    store.dispatch({
        type: "transactions/fetchAll/pending",
        meta: { requestId: "old", requestStatus: "pending" },
    });
    store.dispatch({ type: "auth/logout" });
    store.dispatch({
        type: "auth/setCredentials",
        payload: { user: { id: "other" }, token: "other-token" },
    });
    store.dispatch({
        type: "transactions/fetchAll/fulfilled",
        meta: { requestId: "old", requestStatus: "fulfilled" },
        payload: { transactions: [{ amount: 123 }], pagination: {} },
    });
    expect(store.getState().transactions.transactions).toEqual([]);
});

test("late profile success or rejection from a previous session cannot overwrite current identity", () => {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState: { auth: session },
        middleware: (g) => g().concat(createSessionGuard()),
    });
    for (const id of ["old-success", "old-failure"])
        store.dispatch({
            type: "auth/getProfile/pending",
            meta: { requestId: id, requestStatus: "pending" },
        });
    store.dispatch({ type: "auth/logout" });
    store.dispatch({
        type: "auth/setCredentials",
        payload: { user: { id: "other" }, token: "other-token" },
    });
    store.dispatch({
        type: "auth/getProfile/fulfilled",
        meta: { requestId: "old-success", requestStatus: "fulfilled" },
        payload: { id: "previous" },
    });
    store.dispatch({
        type: "auth/getProfile/rejected",
        meta: { requestId: "old-failure", requestStatus: "rejected" },
        payload: { status: 401 },
    });
    expect(store.getState().auth.user.id).toBe("other");
    expect(store.getState().auth.token).toBe("other-token");
});
