import React, {useEffect, useState} from "react";
import toast from "react-hot-toast";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearError, loginUser} from "../redux/slices/authSlice";
import SocialLogin from "../Components/Auth/SocialLogin";
import logo from "../assets/logo.jpeg";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const {loading, error} = useSelector((state) => state.auth);
    const from = location.state?.from?.pathname || "/dashboard";

    // Animated statistics counters
    const [stats, setStats] = useState({expenses: 0, saved: 0, reports: 0});

    useEffect(() => {
        dispatch(clearError());
        return () => dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        // Slow-roll simulation of counter values on page load
        const interval = setInterval(() => {
            setStats((prev) => {
                const expensesTarget = 1200000;
                const savedTarget = 45800000;
                const reportsTarget = 850000;

                const expensesStep = Math.ceil(expensesTarget / 40);
                const savedStep = Math.ceil(savedTarget / 40);
                const reportsStep = Math.ceil(reportsTarget / 40);

                const nextExpenses = prev.expenses + expensesStep;
                const nextSaved = prev.saved + savedStep;
                const nextReports = prev.reports + reportsStep;

                if (nextExpenses >= expensesTarget) {
                    clearInterval(interval);
                    return {expenses: expensesTarget, saved: savedTarget, reports: reportsTarget};
                }

                return {
                    expenses: nextExpenses,
                    saved: nextSaved,
                    reports: nextReports,
                };
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    const onSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            await dispatch(loginUser({email: formData.get("email"), password: formData.get("password")})).unwrap();
            toast.success("Login successful");
            navigate(from, {replace: true});
        } catch (err) {
            toast.error(err || "Login failed");
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-visual" aria-hidden="true">
                <div className="radial-glow-top" />
                <div className="radial-glow-bottom" />
                
                <div className="visual-container">
                    <div className="visual-header">
                        <img src={logo} alt="Expense Manager" className="fintech-logo" />
                        <div>
                            <h3>Expense Manager</h3>
                        </div>
                    </div>

                    <div className="auth-illustration-container">
                        {/* Floating Cards (Glassmorphic) */}
                        <div className="floating-card card-savings">
                            <div className="card-icon">📈</div>
                            <div className="card-info">
                                <span>Monthly Savings</span>
                                <strong>Rs 28,400</strong>
                                <span className="rate-badge">Rate 32%</span>
                            </div>
                        </div>

                        <div className="floating-card card-budget">
                            <div className="card-icon">🎯</div>
                            <div className="card-info">
                                <span>Budget Goals</span>
                                <strong>82% Met</strong>
                                <div className="mini-progress">
                                    <div className="mini-progress-fill" style={{width: "82%"}} />
                                </div>
                            </div>
                        </div>

                        <div className="floating-card card-insights">
                            <div className="card-icon">💡</div>
                            <div className="card-info">
                                <span>Spending Insights</span>
                                <p>"Food expenses reduced by 15% this week."</p>
                            </div>
                        </div>

                        <div className="floating-card card-income">
                            <div className="card-icon">💰</div>
                            <div className="card-info">
                                <span>Income Streams</span>
                                <strong>5 Active</strong>
                                <span className="deposit-flash">+Rs 15,000</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Counters Grid */}
                    <div className="stats-counters-grid">
                        <div className="stat-counter-item">
                            <strong>{stats.expenses.toLocaleString()}+</strong>
                            <span>Expenses Tracked</span>
                        </div>
                        <div className="stat-counter-item">
                            <strong>Rs {(stats.saved / 1000000).toFixed(1)}M+</strong>
                            <span>Money Saved</span>
                        </div>
                        <div className="stat-counter-item">
                            <strong>{stats.reports.toLocaleString()}+</strong>
                            <span>Reports Generated</span>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="trust-indicators">
                        <div className="trust-badge">
                            <span className="badge-icon">🛡️</span>
                            <span>Secure Authentication</span>
                        </div>
                        <div className="trust-badge">
                            <span className="badge-icon">🔑</span>
                            <span>Data Encryption</span>
                        </div>
                        <div className="trust-badge">
                            <span className="badge-icon">📊</span>
                            <span>Personal Analytics</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="auth-card" aria-label="Sign in form">
                <p className="eyebrow">Welcome Back</p>
                <h1>Sign in to command center</h1>
                <p>Secure login to track budgets, savings goals, and real-time transactions.</p>
                
                <form onSubmit={onSubmit} className="auth-form-modern">
                    <label>
                        Email Address
                        <input name="email" type="email" placeholder="name@domain.com" required autoComplete="email" />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
                    </label>
                    <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in to Dashboard"}
                    </button>
                </form>
                <SocialLogin onSuccess={() => navigate(from, {replace: true})} />
                {error && <p className="form-error" role="alert">{error}</p>}
                <p className="auth-switch">
                    New here? <Link to="/register">Create free account</Link>
                </p>
            </section>
        </main>
    );
};

export default Login;
