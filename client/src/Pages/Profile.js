import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Avatar, Button, Card, Form, Input, message, Row, Col} from "antd";
import AppShell from "../Components/AppShell";
import {changePassword, getProfile, updateProfile} from "../redux/slices/authSlice";

const formatDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

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
                    <Card title="Profile Details">
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
