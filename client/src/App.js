import {useEffect} from "react";
import {Route, Routes, Navigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import HomePage from "./Pages/HomePage";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Income from "./Pages/Income";
import Transactions from "./Pages/Transactions";
import Reports from "./Pages/Reports";
import Profile from "./Pages/Profile";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import {getProfile} from "./redux/slices/authSlice";

function App() {
    const dispatch = useDispatch();
    const {token, isAuthenticated} = useSelector((state) => state.auth);

    useEffect(() => {
        if (token && isAuthenticated) {
            dispatch(getProfile());
        }
    }, [dispatch, token, isAuthenticated]);

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/income"
                element={
                    <ProtectedRoute>
                        <Income />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/transactions"
                element={
                    <ProtectedRoute>
                        <Transactions />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <ProtectedRoute>
                        <Reports />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
