import React from "react";
import Layout from "../Components/Layout/Layout";
import {Link} from "react-router-dom";

const HomePage = () => {
    return (
        <Layout>
            <section className="home-hero">
                <div className="home-hero-glow home-hero-glow-left" />
                <div className="home-hero-glow home-hero-glow-right" />
                <div className="home-hero-inner">
                    <p className="home-eyebrow">Built for focused personal finance</p>
                    <h1 className="home-title">Track every rupee with clarity and control.</h1>
                    <p className="home-subtitle">
                        Plan monthly budgets, tag transactions by category, and review reports that show exactly where
                        your money goes.
                    </p>
                    <div className="home-cta-row">
                        <Link to="/register" className="btn-primary home-cta-btn">
                            Get Started
                        </Link>
                        <Link to="/login" className="btn-secondary home-cta-btn">
                            Login
                        </Link>
                    </div>
                    <div className="home-metrics">
                        <div className="home-metric-card">
                            <p className="home-metric-value">3-step</p>
                            <p className="home-metric-label">Transaction logging</p>
                        </div>
                        <div className="home-metric-card">
                            <p className="home-metric-value">Live</p>
                            <p className="home-metric-label">Balance updates</p>
                        </div>
                        <div className="home-metric-card">
                            <p className="home-metric-value">Monthly</p>
                            <p className="home-metric-label">Insight reports</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-features">
                <div className="home-feature-card">
                    <h3>Category-based tracking</h3>
                    <p>Split spending into useful categories so patterns are visible at a glance.</p>
                </div>
                <div className="home-feature-card">
                    <h3>Dashboard overview</h3>
                    <p>See income, expenses, and net balance together without digging through tables.</p>
                </div>
                <div className="home-feature-card">
                    <h3>Actionable reports</h3>
                    <p>Review monthly trends to cut waste and plan future budgets with confidence.</p>
                </div>
            </section>
        </Layout>
    );
};

export default HomePage;
