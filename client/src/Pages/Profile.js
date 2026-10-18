import React, {useEffect, useState, useRef, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import toast from "react-hot-toast";
import AppShell from "../Components/AppShell";
import {changePassword, getProfile, updateProfile, deleteAccount, logout} from "../redux/slices/authSlice";
import {formatCurrency} from "../utils/finance";

// Circular Canvas-based Cropper Modal Component
const ImageCropperModal = ({imageSrc, onCrop, onCancel}) => {
    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});

    useEffect(() => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            
            const size = 300;
            canvas.width = size;
            canvas.height = size;
            ctx.clearRect(0, 0, size, size);

            const imgWidth = image.width;
            const imgHeight = image.height;
            const minScale = Math.max(size / imgWidth, size / imgHeight);
            const scale = minScale * zoom;

            const w = imgWidth * scale;
            const h = imgHeight * scale;
            const x = (size - w) / 2 + offset.x;
            const y = (size - h) / 2 + offset.y;

            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(image, x, y, w, h);
            ctx.restore();

            // Circular guide outline
            ctx.strokeStyle = "#2dd4bf";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
            ctx.stroke();
        };
    }, [imageSrc, zoom, offset]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({x: e.clientX - offset.x, y: e.clientY - offset.y});
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleApply = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Render clean cropped output without green border
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = 150;
        outputCanvas.height = 150;
        const oCtx = outputCanvas.getContext("2d");

        oCtx.beginPath();
        oCtx.arc(75, 75, 75, 0, Math.PI * 2);
        oCtx.clip();

        // Canvas draws 280x280 area (excluding outline guide)
        oCtx.drawImage(canvas, 10, 10, 280, 280, 0, 0, 150, 150);
        onCrop(outputCanvas.toDataURL("image/jpeg", 0.85));
    };

    return (
        <div className="cropper-modal-overlay">
            <div className="cropper-modal-content finance-card">
                <h3>Position Profile Picture</h3>
                <p className="eyebrow">Drag image to adjust circular crop</p>
                <div
                    className="canvas-container"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{cursor: "grab"}}
                >
                    <canvas ref={canvasRef} />
                </div>
                <div className="zoom-controls">
                    <span>Scale</span>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" className="ghost-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="primary-button" onClick={handleApply}>
                        Crop & Use
                    </button>
                </div>
            </div>
        </div>
    );
};

const formatDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const Profile = () => {
    const dispatch = useDispatch();
    const {user, loading} = useSelector((state) => state.auth);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState("personal"); // personal, finance, security
    const [profile, setProfile] = useState({
        name: "",
        phone: "",
        avatar: "",
        dateOfBirth: "",
        gender: "",
        occupation: "",
        monthlyBudget: 0,
        monthlyIncome: 0,
        monthlySavingsGoal: 0,
        currency: "USD",
        themePreference: "dark",
    });

    const [passwords, setPasswords] = useState({currentPassword: "", newPassword: ""});
    const [cropperSrc, setCropperSrc] = useState(null);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || "",
                phone: user.phone || "",
                avatar: user.avatar || "",
                dateOfBirth: formatDateInput(user.dateOfBirth),
                gender: user.gender || "",
                occupation: user.occupation || "",
                monthlyBudget: user.monthlyBudget ?? 0,
                monthlyIncome: user.monthlyIncome ?? 0,
                monthlySavingsGoal: user.monthlySavingsGoal ?? 0,
                currency: user.currency || "USD",
                themePreference: user.themePreference || "dark",
            });
        }
    }, [user]);

    // Calculate profile completion percentage
    const completionPercentage = useMemo(() => {
        if (!user) return 0;
        const checkFields = [
            user.avatar,
            user.name,
            user.email,
            user.phone,
            user.dateOfBirth,
            user.gender,
            user.occupation,
            user.monthlyBudget > 0 ? user.monthlyBudget : null,
            user.currency,
            user.themePreference,
        ];
        const completed = checkFields.filter((val) => val !== undefined && val !== null && val !== "").length;
        return Math.round((completed / checkFields.length) * 100);
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setCropperSrc(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedBase64) => {
        setProfile((current) => ({...current, avatar: croppedBase64}));
        setCropperSrc(null);
        toast.success("Profile photo adjusted. Click Save to commit.");
    };

    const triggerSaveConfirm = (e) => {
        e.preventDefault();
        setShowSaveConfirm(true);
    };

    const commitProfileSave = async () => {
        setShowSaveConfirm(false);
        try {
            await dispatch(updateProfile(profile)).unwrap();
            setEditMode(false);
            toast.success("Profile changes saved successfully");
        } catch (error) {
            toast.error(error || "Failed to update profile");
        }
    };

    const commitPasswordChange = async (e) => {
        e.preventDefault();
        try {
            await dispatch(changePassword(passwords)).unwrap();
            setPasswords({currentPassword: "", newPassword: ""});
            toast.success("Password changed. Please sign in again.");
        } catch (error) {
            toast.error(error || "Failed to change password");
        }
    };

    const commitDeleteAccount = async () => {
        setShowDeleteConfirm(false);
        try {
            await dispatch(deleteAccount()).unwrap();
            toast.success("Account deleted. Hope to see you again!");
            dispatch(logout());
        } catch (error) {
            toast.error(error || "Failed to delete account");
        }
    };

    return (
        <AppShell title="Account Settings">
            {cropperSrc && (
                <ImageCropperModal
                    imageSrc={cropperSrc}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropperSrc(null)}
                />
            )}

            {showSaveConfirm && (
                <div className="cropper-modal-overlay">
                    <div className="cropper-modal-content finance-card confirm-modal">
                        <h3>Save Changes?</h3>
                        <p>Are you sure you want to write these profile updates to your account?</p>
                        <div className="modal-actions">
                            <button type="button" className="ghost-button" onClick={() => setShowSaveConfirm(false)}>
                                Cancel
                            </button>
                            <button type="button" className="primary-button" onClick={commitProfileSave}>
                                Yes, Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="cropper-modal-overlay">
                    <div className="cropper-modal-content finance-card confirm-modal warning-modal">
                        <span className="warning-icon">⚠️</span>
                        <h3>Permanently Delete Account?</h3>
                        <p>This action is irreversible. All transactions, custom categories, budget milestones, and settings will be wiped forever.</p>
                        <div className="modal-actions">
                            <button type="button" className="ghost-button" onClick={() => setShowDeleteConfirm(false)}>
                                Cancel
                            </button>
                            <button type="button" className="primary-button danger" onClick={commitDeleteAccount}>
                                Delete My Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <section className="profile-layout">
                {/* Profile Card Summary */}
                <div className="finance-card profile-identity">
                    <div className="avatar-wrapper">
                        <img
                            className="profile-avatar"
                            src={profile.avatar || "/logo192.png"}
                            alt={`${profile.name || "User"} avatar`}
                        />
                        {editMode && (
                            <label className="avatar-overlay">
                                📷 Change
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{display: "none"}} />
                            </label>
                        )}
                    </div>
                    <div>
                        <p className="eyebrow">{profile.occupation || "Member"}</p>
                        <h3>{user?.name || "Your Profile"}</h3>
                        <p>{user?.email}</p>
                    </div>

                    <div className="completion-widget">
                        <div className="completion-header">
                            <span>Profile Completion</span>
                            <strong>{completionPercentage}%</strong>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{width: `${completionPercentage}%`}} />
                        </div>
                    </div>

                    <div className="profile-meta-grid">
                        <div>
                            <span>Contact</span>
                            <strong>{user?.phone || "Not added"}</strong>
                        </div>
                        <div>
                            <span>Gender</span>
                            <strong>{user?.gender || "Not specified"}</strong>
                        </div>
                        <div>
                            <span>Currency</span>
                            <strong>{user?.currency || "USD"}</strong>
                        </div>
                        <div>
                            <span>Theme</span>
                            <strong>{(user?.themePreference || "dark").toUpperCase()}</strong>
                        </div>
                    </div>

                    <div className="profile-stat-list">
                        <span>Budget {formatCurrency(user?.monthlyBudget || 0)}</span>
                        <span>Income {formatCurrency(user?.monthlyIncome || 0)}</span>
                        <span>Savings Goal {formatCurrency(user?.monthlySavingsGoal || 0)}</span>
                    </div>

                    <div className="profile-card-actions">
                        <button
                            type="button"
                            className={`primary-button ${editMode ? "cancel-edit" : ""}`}
                            onClick={() => setEditMode(!editMode)}
                        >
                            {editMode ? "Discard Changes" : "Edit Profile"}
                        </button>
                        <button
                            type="button"
                            className="danger-button"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Profile Forms Section */}
                <div className="profile-details-panel">
                    <nav className="tab-menu" aria-label="Settings tabs">
                        <button
                            type="button"
                            className={`tab-item ${activeTab === "personal" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("personal")}
                        >
                            Personal Details
                        </button>
                        <button
                            type="button"
                            className={`tab-item ${activeTab === "finance" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("finance")}
                        >
                            Financial Goals
                        </button>
                        <button
                            type="button"
                            className={`tab-item ${activeTab === "security" ? "tab-active" : ""}`}
                            onClick={() => setActiveTab("security")}
                        >
                            Security
                        </button>
                    </nav>

                    <div className="tab-content">
                        {activeTab === "personal" && (
                            <form className="finance-card profile-form" onSubmit={triggerSaveConfirm}>
                                <div className="form-header">
                                    <div>
                                        <p className="eyebrow">Personal Information</p>
                                        <h3>Identity, Contact details</h3>
                                    </div>
                                </div>

                                <label>
                                    Full Name
                                    <input
                                        value={profile.name}
                                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                                        disabled={!editMode}
                                        required
                                    />
                                </label>
                                <label>
                                    Email Address
                                    <input value={user?.email || ""} disabled />
                                    <span className="input-helper">Email cannot be modified</span>
                                </label>
                                <label>
                                    Contact Number
                                    <input
                                        value={profile.phone}
                                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                        disabled={!editMode}
                                        placeholder="+1234567890"
                                    />
                                </label>
                                <label>
                                    Date of Birth
                                    <input
                                        type="date"
                                        value={profile.dateOfBirth}
                                        onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                                        disabled={!editMode}
                                    />
                                </label>
                                <label>
                                    Gender
                                    <select
                                        value={profile.gender}
                                        onChange={(e) => setProfile({...profile, gender: e.target.value})}
                                        disabled={!editMode}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </label>
                                <label>
                                    Occupation
                                    <input
                                        value={profile.occupation}
                                        onChange={(e) => setProfile({...profile, occupation: e.target.value})}
                                        disabled={!editMode}
                                        placeholder="Software Engineer, Consultant, Student..."
                                    />
                                </label>

                                {editMode && (
                                    <button type="submit" className="primary-button" disabled={loading}>
                                        Save Personal Details
                                    </button>
                                )}
                            </form>
                        )}

                        {activeTab === "finance" && (
                            <form className="finance-card profile-form" onSubmit={triggerSaveConfirm}>
                                <div className="form-header">
                                    <div>
                                        <p className="eyebrow">Financial Configuration</p>
                                        <h3>Monthly goals, Currency & theme</h3>
                                    </div>
                                </div>

                                <div className="form-grid">
                                    <label>
                                        Monthly Budget Goal
                                        <input
                                            type="number"
                                            min="0"
                                            value={profile.monthlyBudget}
                                            onChange={(e) => setProfile({...profile, monthlyBudget: Number(e.target.value)})}
                                            disabled={!editMode}
                                        />
                                    </label>
                                    <label>
                                        Monthly Est. Income
                                        <input
                                            type="number"
                                            min="0"
                                            value={profile.monthlyIncome}
                                            onChange={(e) => setProfile({...profile, monthlyIncome: Number(e.target.value)})}
                                            disabled={!editMode}
                                        />
                                    </label>
                                    <label>
                                        Monthly Savings Goal
                                        <input
                                            type="number"
                                            min="0"
                                            value={profile.monthlySavingsGoal}
                                            onChange={(e) => setProfile({...profile, monthlySavingsGoal: Number(e.target.value)})}
                                            disabled={!editMode}
                                        />
                                    </label>
                                    <label>
                                        Currency Preference
                                        <select
                                            value={profile.currency}
                                            onChange={(e) => setProfile({...profile, currency: e.target.value})}
                                            disabled={!editMode}
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="INR">INR (₹)</option>
                                            <option value="JPY">JPY (¥)</option>
                                            <option value="AUD">AUD (A$)</option>
                                            <option value="CAD">CAD (C$)</option>
                                        </select>
                                    </label>
                                    <label className="form-span">
                                        Interface Theme Preference
                                        <select
                                            value={profile.themePreference}
                                            onChange={(e) => setProfile({...profile, themePreference: e.target.value})}
                                            disabled={!editMode}
                                        >
                                            <option value="dark">Dark Theme Command Center</option>
                                            <option value="light">Light Theme Workspace</option>
                                        </select>
                                    </label>
                                </div>

                                {editMode && (
                                    <button type="submit" className="primary-button" disabled={loading}>
                                        Save Financial Settings
                                    </button>
                                )}
                            </form>
                        )}

                        {activeTab === "security" && (
                            <form className="finance-card profile-form" onSubmit={commitPasswordChange}>
                                <div className="form-header">
                                    <div>
                                        <p className="eyebrow">Security Center</p>
                                        <h3>Update security credentials</h3>
                                    </div>
                                </div>

                                <label>
                                    Current Password
                                    <input
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                                        required
                                    />
                                </label>
                                <label>
                                    New Password
                                    <input
                                        type="password"
                                        minLength={6}
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                        required
                                    />
                                </label>

                                <button type="submit" className="primary-button" disabled={loading}>
                                    Change Security Password
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </AppShell>
    );
};

export default Profile;
