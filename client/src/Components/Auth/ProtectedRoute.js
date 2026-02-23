import React from "react";
import {useSelector} from "react-redux";
import {Navigate, useLocation} from "react-router-dom";
import Spinner from "../Spinner";

const ProtectedRoute = ({children}) => {
    const {isAuthenticated, loading} = useSelector((state) => state.auth);
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login page with return url
        return <Navigate to="/login" state={{from: location}} replace />;
    }

    return children;
};

export default ProtectedRoute;
