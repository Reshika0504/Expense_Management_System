import React from "react";

const Profile = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">User Profile</h1>
                <p className="text-gray-600">Manage your account settings</p>
                <div className="mt-8 p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Features Coming Soon:</h2>
                    <ul className="text-left space-y-2 text-gray-700">
                        <li>• Update profile information</li>
                        <li>• Change password</li>
                        <li>• Account preferences</li>
                        <li>• Notification settings</li>
                        <li>• Privacy controls</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Profile;
