import React from "react";
import toast from "react-hot-toast";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearError, loginUser} from "../redux/slices/authSlice";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const {loading, error} = useSelector((state) => state.auth);
    const from = location.state?.from?.pathname || "/dashboard";

    React.useEffect(() => {
        dispatch(clearError());
        return () => dispatch(clearError());
    }, [dispatch]);

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
                <div className="auth-illustration">
                    <div className="wallet-card wallet-card-main">
                        <span>Monthly cash flow</span>
                        <strong>Rs 84,250</strong>
                    </div>
                    <div className="wallet-card wallet-card-float">
                        <span>Savings rate</span>
                        <strong>32%</strong>
                    </div>
                </div>
            </section>
            <section className="auth-card" aria-label="Sign in form">
                <p className="eyebrow">Expense Manager</p>
                <h1>Sign in to your finance dashboard</h1>
                <p>Monitor budgets, categories, savings goals, and every transaction in one workspace.</p>
                <form onSubmit={onSubmit} className="auth-form-modern">
                    <label>
                        Email address
                        <input name="email" type="email" required autoComplete="email" />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" required autoComplete="current-password" />
                    </label>
                    <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
                {error && <p className="form-error">{error}</p>}
                <p className="auth-switch">
                    New here? <Link to="/register">Create account</Link>
                </p>
            </section>
        </main>
    );
};

export default Login;
