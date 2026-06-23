import React, {useEffect, useState} from "react";
import {NavLink, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {logout} from "../redux/slices/authSlice";

const navItems = [
    {to: "/dashboard", label: "Dashboard"},
    {to: "/transactions", label: "Transactions"},
    {to: "/reports", label: "Reports"},
    {to: "/profile", label: "Profile"},
];

const AppShell = ({title, children}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {user} = useSelector((state) => state.auth);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    return (
        <div className="app-shell">
            <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="Primary navigation">
                <div className="brand-lockup">
                    <div className="brand-mark">EM</div>
                    <div>
                        <h1>Expense Manager</h1>
                        <p>Finance command center</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({isActive}) => `nav-item ${isActive ? "nav-item-active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <button type="button" className="ghost-button" onClick={() => setDarkMode((value) => !value)}>
                    {darkMode ? "Light mode" : "Dark mode"}
                </button>
            </aside>

            {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

            <div className="main-panel">
                <header className="topbar">
                    <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen(true)}>
                        Menu
                    </button>
                    <div>
                        <p className="eyebrow">Welcome back</p>
                        <h2>{title}</h2>
                    </div>
                    <div className="topbar-user">
                        <div className="avatar-circle" aria-hidden="true">
                            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong>{user?.name || "User"}</strong>
                            <span>{user?.email || "Signed in"}</span>
                        </div>
                        <button type="button" className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                <main className="page-content">{children}</main>
            </div>
        </div>
    );
};

export default AppShell;
