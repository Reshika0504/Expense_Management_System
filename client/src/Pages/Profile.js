import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Avatar, Button, Card, Form, Input, InputNumber, message, Row, Col} from "antd";
import AppShell from "../Components/AppShell";
import {changePassword, getProfile, updateProfile} from "../redux/slices/authSlice";

const formatDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
    if (!value) return "Not added";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not added";
    return date.toLocaleDateString();
};

const currencyFormatter = (value) => (value === undefined || value === null ? "" : `Rs ${value}`);
const currencyParser = (value) => (value || "").replace(/[^\d.]/g, "");

const Profile = () => {
    const dispatch = useDispatch();
    const {user, loading} = useSelector((state) => state.auth);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    useEffect(() => {
        profileForm.setFieldsValue({
            name: user?.name || "",
            phone: user?.phone || "",
            avatar: user?.avatar || "",
            dateOfBirth: formatDateInput(user?.dateOfBirth),
            monthlyBudget: user?.monthlyBudget ?? 0,
            monthlyIncome: user?.monthlyIncome ?? 0,
        });
    }, [user, profileForm]);

    const onProfileSubmit = async (values) => {
        try {
            await dispatch(updateProfile(values)).unwrap();
            message.success("Profile updated");
        } catch (error) {
            message.error(error || "Failed to update profile");
        }
    };

    const onPasswordSubmit = async (values) => {
        try {
            await dispatch(changePassword(values)).unwrap();
            message.success("Password changed");
            passwordForm.resetFields();
        } catch (error) {
            message.error(error || "Failed to change password");
        }
    };

    return (
        <AppShell title="Profile">
            <Row gutter={16}>
                <Col xs={24} lg={12}>
                    <Card title="Profile Details" className="profile-summary-card">
                        <div className="profile-summary">
                            <Avatar size={96} src={user?.avatar}>
                                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <h3>{user?.name || "Your Name"}</h3>
                                <p>{user?.email || "Email not available"}</p>
                            </div>
                        </div>
                        <div className="profile-detail-grid">
                            <div>
                                <span>Contact</span>
                                <strong>{user?.phone || "Not added"}</strong>
                            </div>
                            <div>
                                <span>Date of Birth</span>
                                <strong>{formatDisplayDate(user?.dateOfBirth)}</strong>
                            </div>
                            <div>
                                <span>Monthly Budget</span>
                                <strong>Rs {(user?.monthlyBudget ?? 0).toLocaleString()}</strong>
                            </div>
                            <div>
                                <span>Monthly Income</span>
                                <strong>Rs {(user?.monthlyIncome ?? 0).toLocaleString()}</strong>
                            </div>
                        </div>
                    </Card>

                    <Card title="Edit Profile" className="profile-edit-card">
                        <Form form={profileForm} layout="vertical" onFinish={onProfileSubmit}>
                            <Form.Item shouldUpdate={(prev, current) => prev.avatar !== current.avatar} noStyle>
                                {({getFieldValue}) => (
                                    <div className="profile-photo-preview">
                                        <Avatar size={88} src={getFieldValue("avatar") || user?.avatar}>
                                            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                                        </Avatar>
                                    </div>
                                )}
                            </Form.Item>
                            <Form.Item label="Name" name="name" rules={[{required: true, min: 2}]}>
                                <Input />
                            </Form.Item>
                            <Form.Item label="Email">
                                <Input value={user?.email || ""} disabled />
                            </Form.Item>
                            <Form.Item label="Contact Number" name="phone">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Date of Birth" name="dateOfBirth">
                                <Input type="date" />
                            </Form.Item>
                            <Form.Item label="Photo URL" name="avatar">
                                <Input />
                            </Form.Item>
                            <Form.Item label="Monthly Budget" name="monthlyBudget">
                                <InputNumber
                                    min={0}
                                    className="profile-number-input"
                                    formatter={currencyFormatter}
                                    parser={currencyParser}
                                />
                            </Form.Item>
                            <Form.Item label="Monthly Income" name="monthlyIncome">
                                <InputNumber
                                    min={0}
                                    className="profile-number-input"
                                    formatter={currencyFormatter}
                                    parser={currencyParser}
                                />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Save Profile
                            </Button>
                        </Form>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Change Password">
                        <Form form={passwordForm} layout="vertical" onFinish={onPasswordSubmit}>
                            <Form.Item
                                label="Current Password"
                                name="currentPassword"
                                rules={[{required: true, message: "Current password is required"}]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Form.Item
                                label="New Password"
                                name="newPassword"
                                rules={[{required: true, min: 6, message: "At least 6 characters"}]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Change Password
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </AppShell>
    );
};

export default Profile;
