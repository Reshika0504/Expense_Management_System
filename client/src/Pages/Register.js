import React, {useEffect, useState} from "react";
import toast from "react-hot-toast";
import {Link, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearError, registerUser} from "../redux/slices/authSlice";
import logo from "../assets/logo.jpeg";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {loading, error} = useSelector((state) => state.auth);

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
            await dispatch(
                registerUser({
                    name: formData.get("name"),
                    email: formData.get("email"),
                    password: formData.get("password"),
                    phone: formData.get("phone"),
                })
            ).unwrap();
            toast.success("Account created successfully");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err || "Registration failed");
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

            <section className="auth-card" aria-label="Create account form">
                <p className="eyebrow">Start Tracking</p>
                <h1>Create your account</h1>
                <p>Build healthy financial habits. Sign up in less than a minute.</p>
                
                <form onSubmit={onSubmit} className="auth-form-modern">
                    <label>
                        Full Name
                        <input name="name" placeholder="John Doe" required minLength={2} autoComplete="name" />
                    </label>
                    <label>
                        Email Address
                        <input name="email" type="email" placeholder="name@domain.com" required autoComplete="email" />
                    </label>
                    <label>
                        Contact Number
                        <input name="phone" placeholder="+1 555-0199" autoComplete="tel" />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" placeholder="•••••••• (Min 6 characters)" required minLength={6} autoComplete="new-password" />
                    </label>
                    <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? "Creating..." : "Create Free Account"}
                    </button>
                </form>
                {error && <p className="form-error">{error}</p>}
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in here</Link>
                </p>
            </section>
        </main>
    );
};

export default Register;
