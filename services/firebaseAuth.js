const {getApps, initializeApp} = require('firebase-admin/app');
const {getAuth} = require('firebase-admin/auth');

// ID-token verification uses Google's public signing certificates. No private
// service-account key is needed because we do not administer Firebase users.
const verifyFirebaseToken = async (idToken) => {
    if (!process.env.FIREBASE_PROJECT_ID) {
        const error = new Error('Google sign-in are not configured yet. Please use email and password.');
        error.status = 503;
        throw error;
    }
    const app = getApps().find((item) => item.name === 'spendwise-auth') ||
        initializeApp({projectId: process.env.FIREBASE_PROJECT_ID}, 'spendwise-auth');
    return getAuth(app).verifyIdToken(idToken);
};

module.exports = {verifyFirebaseToken};
