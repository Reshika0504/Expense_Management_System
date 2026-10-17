import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import {FiMenu, FiX} from "react-icons/fi";
import Brand from "../Brand";

const navLinks = [
    {label: "Features", href: "#features"},
    {label: "Reports", href: "#features"},
    {label: "Security", href: "#features"},
];

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, {passive: true});
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const closeMenu = () => setIsOpen(false);

    return (
        <motion.header
            initial={{y: -18, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{duration: 0.45, ease: "easeOut"}}
            className={`landing-navbar ${isScrolled ? "landing-navbar-scrolled" : ""}`}
        >
            <div className="landing-nav-inner">
                <Link to="/" className="landing-brand" aria-label="Spendwise home">
                    <Brand />
                </Link>

                <nav className="landing-nav-links" aria-label="Landing page">
                    {navLinks.map((link) => (
                        <a key={link.label} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="landing-nav-actions">
                    <Link to="/login" className="landing-btn landing-btn-secondary">
                        Sign in
                    </Link>
                    <Link to="/register" className="landing-btn landing-btn-primary">
                        Get started ↗
                    </Link>
                </div>

                <button
                    className="landing-menu-button"
                    type="button"
                    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((value) => !value)}
                >
                    {isOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="landing-mobile-panel"
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -10}}
                        transition={{duration: 0.18}}
                    >
                        {navLinks.map((link) => (
                            <a key={link.label} href={link.href} onClick={closeMenu}>
                                {link.label}
                            </a>
                        ))}
                        <div className="landing-mobile-actions">
                            <Link to="/login" className="landing-btn landing-btn-secondary" onClick={closeMenu}>
                                Sign in
                            </Link>
                            <Link to="/register" className="landing-btn landing-btn-primary" onClick={closeMenu}>
                                Get started ↗
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
};

export default Navbar;
