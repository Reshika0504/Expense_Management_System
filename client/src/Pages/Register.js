import React from "react";
import {Form, Input, message} from "antd";
import {Link, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {registerUser, clearError} from "../redux/slices/authSlice";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {loading, error} = useSelector((state) => state.auth);

    const onFinish = async (values) => {
        try {
            await dispatch(registerUser(values)).unwrap();
            message.success("Registration successful! Welcome aboard.");
            navigate("/dashboard");
        } catch (err) {
            message.error(err || "Registration failed");
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
                    <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{" "}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                <Form name="register" onFinish={onFinish} onFinishFailed={onFinishFailed} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="mt-1">
                            <Form.Item
                                name="name"
                                rules={[
                                    {required: true, message: "Please input your name!"},
                                    {min: 2, message: "Name must be at least 2 characters"},
                                ]}
                                noStyle
                            >
                                <Input className="form-input" placeholder="Enter your full name" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <div className="mt-1">
                            <Form.Item
                                name="email"
                                rules={[
                                    {required: true, message: "Please input your email!"},
                                    {type: "email", message: "Please enter a valid email!"},
                                ]}
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
                                rules={[
                                    {required: true, message: "Please input your password!"},
                                    {min: 6, message: "Password must be at least 6 characters"},
                                ]}
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
                            {loading ? "Creating account..." : "Create account"}
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

export default Register;
