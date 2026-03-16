import React from "react";
import {NavLink, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {logout} from "../redux/slices/authSlice";

const linkStyle = ({isActive}) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
        isActive ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

const AppShell = ({title, children}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {user} = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Expense Manager</h1>
                        <p className="text-sm text-gray-500">Hello, {user?.name || "User"}</p>
                    </div>
                    <nav className="flex items-center gap-2">
                        <NavLink to="/dashboard" className={linkStyle}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/transactions" className={linkStyle}>
                            Transactions
                        </NavLink>
                        <NavLink to="/reports" className={linkStyle}>
                            Reports
                        </NavLink>
                        <NavLink to="/profile" className={linkStyle}>
                            Profile
                        </NavLink>
                        <button onClick={handleLogout} className="btn-secondary">
                            Logout
                        </button>
                    </nav>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
                {children}
            </main>
        </div>
    );
};

export default AppShell;
