import React, {useEffect} from "react";
import toast from "react-hot-toast";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearError, loginUser} from "../redux/slices/authSlice";
import ConnectionNotice from "../Components/Auth/ConnectionNotice";
import SocialLogin from "../Components/Auth/SocialLogin";
import AuthVisual from "../Components/Auth/AuthVisual";
import Brand from "../Components/Brand";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const {loading, error} = useSelector((state) => state.auth);
    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
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
            <AuthVisual />

            <section className="auth-card" aria-label="Sign in form">
                <Link to="/" className="auth-mobile-brand" aria-label="Spendwise home"><Brand /></Link>
                <p className="eyebrow">Welcome Back</p>
                <h1>Your space, your pace.</h1>
                <p>Welcome back. A little clarity is just a sign-in away.</p>
                
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
                        {loading ? "Signing in..." : "Sign in to Spendwise"}
                    </button>
                </form>
                <ConnectionNotice loading={loading} />
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
