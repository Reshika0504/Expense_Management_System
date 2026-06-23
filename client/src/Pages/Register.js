import React from "react";
import toast from "react-hot-toast";
import {Link, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearError, registerUser} from "../redux/slices/authSlice";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {loading, error} = useSelector((state) => state.auth);

    React.useEffect(() => {
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
            toast.success("Account created");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err || "Registration failed");
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-visual" aria-hidden="true">
                <div className="auth-illustration">
                    <div className="wallet-card wallet-card-main">
                        <span>Budget control</span>
                        <strong>Smart goals</strong>
                    </div>
                    <div className="wallet-card wallet-card-float">
                        <span>Insights</span>
                        <strong>Auto generated</strong>
                    </div>
                </div>
            </section>
            <section className="auth-card" aria-label="Create account form">
                <p className="eyebrow">Start tracking</p>
                <h1>Create your account</h1>
                <p>Build healthier spending habits with a clean monthly command center.</p>
                <form onSubmit={onSubmit} className="auth-form-modern">
                    <label>
                        Full name
                        <input name="name" required minLength={2} autoComplete="name" />
                    </label>
                    <label>
                        Email address
                        <input name="email" type="email" required autoComplete="email" />
                    </label>
                    <label>
                        Contact number
                        <input name="phone" autoComplete="tel" />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" required minLength={6} autoComplete="new-password" />
                    </label>
                    <button type="submit" className="primary-button" disabled={loading}>
                        {loading ? "Creating..." : "Create account"}
                    </button>
                </form>
                {error && <p className="form-error">{error}</p>}
                <p className="auth-switch">
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
};

export default Register;
