import React, {useEffect} from "react";
import toast from "react-hot-toast";
import {Link, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearError, registerUser} from "../redux/slices/authSlice";
import ConnectionNotice from "../Components/Auth/ConnectionNotice";
import SocialLogin from "../Components/Auth/SocialLogin";
import AuthVisual from "../Components/Auth/AuthVisual";
import Brand from "../Components/Brand";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {loading, error} = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(clearError());
        return () => dispatch(clearError());
    }, [dispatch]);

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
            <AuthVisual />

            <section className="auth-card" aria-label="Create account form">
                <Link to="/" className="auth-mobile-brand" aria-label="Spendwise home"><Brand /></Link>
                <p className="eyebrow">Start Tracking</p>
                <h1>Good things start here.</h1>
                <p>Create your own little corner for better money habits.</p>
                
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
                        Contact number (optional)
                        <input name="phone" type="tel" placeholder="+919876543210" autoComplete="tel" />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" placeholder="•••••••• (Min 6 characters)" required minLength={6} autoComplete="new-password" />
                    </label>
                    <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? "Creating..." : "Create my space"}
                    </button>
                </form>
                <ConnectionNotice loading={loading} />
                <SocialLogin onSuccess={() => navigate("/dashboard", {replace: true})} />
                {error && <p className="form-error" role="alert">{error}</p>}
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in here</Link>
                </p>
            </section>
        </main>
    );
};

export default Register;
