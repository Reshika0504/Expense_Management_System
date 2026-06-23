import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import toast from "react-hot-toast";
import AppShell from "../Components/AppShell";
import {changePassword, getProfile, updateProfile} from "../redux/slices/authSlice";
import {formatCurrency} from "../utils/finance";

const formatDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const Profile = () => {
    const dispatch = useDispatch();
    const {user, loading} = useSelector((state) => state.auth);
    const [profile, setProfile] = useState({
        name: "",
        phone: "",
        avatar: "",
        dateOfBirth: "",
        monthlyBudget: 0,
        monthlyIncome: 0,
        monthlySavingsGoal: 0,
    });
    const [passwords, setPasswords] = useState({currentPassword: "", newPassword: ""});

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    useEffect(() => {
        setProfile({
            name: user?.name || "",
            phone: user?.phone || "",
            avatar: user?.avatar || "",
            dateOfBirth: formatDateInput(user?.dateOfBirth),
            monthlyBudget: user?.monthlyBudget ?? 0,
            monthlyIncome: user?.monthlyIncome ?? 0,
            monthlySavingsGoal: user?.monthlySavingsGoal ?? 0,
        });
    }, [user]);

    const handleAvatarUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setProfile((current) => ({...current, avatar: reader.result}));
            toast.success("Avatar ready to save");
        };
        reader.readAsDataURL(file);
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        try {
            await dispatch(updateProfile(profile)).unwrap();
            toast.success("Profile updated");
        } catch (error) {
            toast.error(error || "Failed to update profile");
        }
    };

    const savePassword = async (event) => {
        event.preventDefault();
        try {
            await dispatch(changePassword(passwords)).unwrap();
            setPasswords({currentPassword: "", newPassword: ""});
            toast.success("Password changed");
        } catch (error) {
            toast.error(error || "Failed to change password");
        }
    };

    return (
        <AppShell title="Profile">
            <section className="profile-layout">
                <div className="finance-card profile-identity">
                    <img className="profile-avatar" src={profile.avatar || "/logo192.png"} alt={`${profile.name || "User"} avatar`} />
                    <div>
                        <p className="eyebrow">Profile</p>
                        <h3>{user?.name || "Your profile"}</h3>
                        <p>{user?.email}</p>
                    </div>
                    <div className="profile-stat-list">
                        <span>Budget {formatCurrency(user?.monthlyBudget || 0)}</span>
                        <span>Income {formatCurrency(user?.monthlyIncome || 0)}</span>
                        <span>Savings Goal {formatCurrency(user?.monthlySavingsGoal || 0)}</span>
                    </div>
                </div>

                <form className="finance-card profile-form" onSubmit={saveProfile}>
                    <div className="form-header">
                        <div>
                            <p className="eyebrow">Manage details</p>
                            <h3>Personal and finance settings</h3>
                        </div>
                    </div>

                    <label>
                        Avatar upload
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                    <label>
                        Name
                        <input value={profile.name} onChange={(event) => setProfile({...profile, name: event.target.value})} required />
                    </label>
                    <label>
                        Email
                        <input value={user?.email || ""} disabled />
                    </label>
                    <label>
                        Contact
                        <input value={profile.phone} onChange={(event) => setProfile({...profile, phone: event.target.value})} />
                    </label>
                    <label>
                        Date of birth
                        <input type="date" value={profile.dateOfBirth} onChange={(event) => setProfile({...profile, dateOfBirth: event.target.value})} />
                    </label>
                    <div className="form-grid">
                        <label>
                            Monthly budget
                            <input type="number" min="0" value={profile.monthlyBudget} onChange={(event) => setProfile({...profile, monthlyBudget: Number(event.target.value)})} />
                        </label>
                        <label>
                            Monthly income
                            <input type="number" min="0" value={profile.monthlyIncome} onChange={(event) => setProfile({...profile, monthlyIncome: Number(event.target.value)})} />
                        </label>
                        <label>
                            Monthly savings goal
                            <input
                                type="number"
                                min="0"
                                value={profile.monthlySavingsGoal}
                                onChange={(event) => setProfile({...profile, monthlySavingsGoal: Number(event.target.value)})}
                            />
                        </label>
                    </div>
                    <button type="submit" className="primary-button" disabled={loading}>
                        Save profile
                    </button>
                </form>

                <form className="finance-card profile-form" onSubmit={savePassword}>
                    <div className="form-header">
                        <div>
                            <p className="eyebrow">Security</p>
                            <h3>Change password</h3>
                        </div>
                    </div>
                    <label>
                        Current password
                        <input
                            type="password"
                            value={passwords.currentPassword}
                            onChange={(event) => setPasswords({...passwords, currentPassword: event.target.value})}
                            required
                        />
                    </label>
                    <label>
                        New password
                        <input
                            type="password"
                            minLength={6}
                            value={passwords.newPassword}
                            onChange={(event) => setPasswords({...passwords, newPassword: event.target.value})}
                            required
                        />
                    </label>
                    <button type="submit" className="primary-button" disabled={loading}>
                        Change password
                    </button>
                </form>
            </section>
        </AppShell>
    );
};

export default Profile;
