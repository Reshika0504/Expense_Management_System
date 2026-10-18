// A response started under a previous account must never repopulate private UI data.
// Request IDs live only until their bounded API request settles; nothing is persisted.
export const createSessionGuard = () => {
    const requests = new Map();
    return ({ getState }) =>
        (next) =>
        (action) => {
            if (
                !/^(?:(?:transactions|categories|dashboard)\/|auth\/(?:getProfile|updateProfile|changePassword|deleteAccount)\/)/.test(
                    action.type || "",
                ) ||
                !action.meta?.requestId
            )
                return next(action);
            const { requestId, requestStatus } = action.meta;
            if (requestStatus === "pending")
                requests.set(requestId, getState().auth.token);
            else if (
                requestStatus === "fulfilled" ||
                requestStatus === "rejected"
            ) {
                const token = requests.get(requestId);
                requests.delete(requestId);
                if (!token || token !== getState().auth.token) return action;
            }
            return next(action);
        };
};
