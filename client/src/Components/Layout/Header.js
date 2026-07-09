import React from "react";
import {Link, NavLink} from "react-router-dom";
import {useSelector} from "react-redux";
import logo from "../../assets/logo.jpeg";

const Header = () => {
    const {isAuthenticated} = useSelector((state) => state.auth);

    return (
        <header className="bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link className="header-brand" to="/" aria-label="Expense Manager home">
                    <img src={logo} alt="Expense Manager" className="header-brand-logo" />
                    <span>Expense Manager</span>
                </Link>
                <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <NavLink to="/dashboard" className="btn-primary">
                            Go to Dashboard
                        </NavLink>
                    ) : (
                        <>
                            <NavLink to="/login" className="btn-secondary">
                                Login
                            </NavLink>
                            <NavLink to="/register" className="btn-primary">
                                Register
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
