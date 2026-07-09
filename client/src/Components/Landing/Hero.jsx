import React from "react";
import {Link} from "react-router-dom";
import {motion} from "framer-motion";
import {FiCheckCircle, FiShield, FiTrendingUp, FiBarChart2} from "react-icons/fi";
import heroImage from "../../assets/landingpage.jpeg";

const chips = [
    {label: "Real-time Tracking", icon: FiCheckCircle},
    {label: "Smart Reports", icon: FiBarChart2},
    {label: "Secure Authentication", icon: FiShield},
];

const Hero = () => {
    return (
        <section className="landing-hero">
            <div className="landing-orb landing-orb-blue" />
            <div className="landing-orb landing-orb-pink" />
            <div className="landing-hero-inner">
                <motion.div
                    className="landing-hero-copy"
                    initial={{opacity: 0, y: 34}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.65, ease: "easeOut"}}
                >
                    <span className="landing-badge">
                        <FiTrendingUp />
                        Personal Finance Simplified
                    </span>
                    <h1>Track Every Rupee with Clarity and Control.</h1>
                    <p>
                        Plan budgets, monitor expenses, analyze spending patterns, and make smarter financial decisions
                        with powerful reports and real-time insights.
                    </p>
                    <div className="landing-hero-actions">
                        <motion.div whileHover={{scale: 1.04}} whileTap={{scale: 0.98}}>
                            <Link to="/register" className="landing-btn landing-btn-primary landing-btn-lg">
                                Get Started
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{scale: 1.04}} whileTap={{scale: 0.98}}>
                            <Link to="/login" className="landing-btn landing-btn-secondary landing-btn-lg">
                                Login
                            </Link>
                        </motion.div>
                    </div>
                    <div className="landing-chip-row">
                        {chips.map(({label, icon: Icon}) => (
                            <span key={label} className="landing-chip">
                                <Icon />
                                {label}
                            </span>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="landing-hero-visual"
                    initial={{opacity: 0, x: 54}}
                    animate={{opacity: 1, x: 0}}
                    transition={{duration: 0.7, delay: 0.15, ease: "easeOut"}}
                >
                    <motion.img
                        src={heroImage}
                        alt="SpendSmart wallet and dashboard illustration"
                        className="landing-hero-image"
                        loading="eager"
                        animate={{y: [0, -14, 0]}}
                        transition={{duration: 5.5, repeat: Infinity, ease: "easeInOut"}}
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
