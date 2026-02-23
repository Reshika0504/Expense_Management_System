import React from "react";
import {Form, Input, message} from "antd";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {loginUser, clearError} from "../redux/slices/authSlice";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const {loading, error} = useSelector((state) => state.auth);

    // Get the return url from location state or default to dashboard
    const from = location.state?.from?.pathname || "/dashboard";

    const onFinish = async (values) => {
        try {
            await dispatch(loginUser(values)).unwrap();
            message.success("Login successful!");
            navigate(from, {replace: true});
        } catch (err) {
            message.error(err || "Login failed");
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
        message.error("Please check your inputs");
    };

    // Clear error when component mounts or unmounts
    React.useEffect(() => {
        dispatch(clearError());
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    return (
        <div className="register-page min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="auth-form">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{" "}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            create a new account
                        </Link>
                    </p>
                </div>

                <Form
                    name="login"
                    initialValues={{remember: true}}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    className="space-y-6"
                >
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <div className="mt-1">
                            <Form.Item
                                name="email"
                                rules={[{required: true, message: "Please input your email!"}]}
                                noStyle
                            >
                                <Input type="email" className="form-input" placeholder="Enter your email" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1">
                            <Form.Item
                                name="password"
                                rules={[{required: true, message: "Please input your password!"}]}
                                noStyle
                            >
                                <Input.Password className="form-input" placeholder="Enter your password" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex justify-center py-2 px-4"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </Form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
