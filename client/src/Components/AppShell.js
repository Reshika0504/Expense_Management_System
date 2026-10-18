import React, {useEffect, useState} from "react";
import {NavLink, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {logoutUser} from "../redux/slices/authSlice";
import toast from 'react-hot-toast';
import Brand from "./Brand";
import {FiGrid, FiTrendingUp, FiRepeat, FiPieChart, FiUser, FiSun, FiMoon, FiLogOut} from "react-icons/fi";

const navItems = [
    {to: "/dashboard", label: "Overview", icon: FiGrid},
    {to: "/income", label: "Income", icon: FiTrendingUp},
    {to: "/transactions", label: "Transactions", icon: FiRepeat},
    {to: "/reports", label: "Reports", icon: FiPieChart},
    {to: "/profile", label: "Your profile", icon: FiUser},
];

const AppShell = ({title, children}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {user} = useSelector((state) => state.auth);
    const [darkMode, setDarkMode] = useState(() => {
        const localTheme = localStorage.getItem("theme");
        return localTheme ? localTheme === "dark" : true;
    });
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (user?.themePreference) {
            setDarkMode(user.themePreference === "dark");
        }
    }, [user?.themePreference]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("theme", darkMode ? "dark" : "light");
    }, [darkMode]);

    const [signingOut,setSigningOut]=useState(false);
    const handleLogout = async () => {
        setSigningOut(true);
        try {await dispatch(logoutUser()).unwrap(); navigate('/login');}
        catch(error){toast.error(error || 'Unable to sign out. Please retry.');}
        finally {setSigningOut(false);}
    };

    return (
        <div className="app-shell">
            <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`} aria-label="Primary navigation">
                <div className="brand-lockup">
                    <Brand />
                </div>

                <p className="sidebar-caption">YOUR SPACE</p>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({isActive}) => `nav-item ${isActive ? "nav-item-active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            <item.icon aria-hidden="true" /> {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-note"><span>Little steps, brighter days.</span><p>Your next money milestone starts with a little clarity.</p></div>
                <button type="button" className="ghost-button theme-toggle" onClick={() => setDarkMode((value) => !value)}>
                    {darkMode ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />} {darkMode ? "Light mode" : "Dark mode"}
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
                        <button type="button" className="logout-button" onClick={handleLogout} disabled={signingOut}>
                            <FiLogOut aria-hidden="true" /> <span className="logout-label">Sign out</span>
                        </button>
                    </div>
                </header>

                <main className="page-content">{children}</main>
            </div>
        </div>
    );
};

export default AppShell;
