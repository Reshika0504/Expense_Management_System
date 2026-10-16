import {initializeApp, getApps} from 'firebase/app';
import {getAuth, inMemoryPersistence, setPersistence} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
let authPromise;
export function getFirebaseAuth() {
    if (!isFirebaseConfigured) throw new Error('Google sign-in is being set up. Please use email and password.');
    if (!authPromise) {
        const app = getApps().find((item) => item.name === 'spendwise') || initializeApp(firebaseConfig, 'spendwise');
        const auth = getAuth(app);
        auth.languageCode = 'en';
        authPromise = setPersistence(auth, inMemoryPersistence).then(() => auth);
    }
    return authPromise;
}

export function authErrorMessage(error) {
    const messages = {
        'auth/popup-closed-by-user': 'Google sign-in was cancelled. Please try again.',
        'auth/popup-blocked': 'Allow popups for this site and try again.',
        'auth/unauthorized-domain': 'This website has not been enabled for Google sign-in yet.',
        'auth/operation-not-allowed': 'This sign-in method has not been enabled yet.',
        'auth/network-request-failed': 'Could not connect. Please check your connection and try again.',
    };
    return messages[error?.code] || (typeof error === 'string' ? error : error?.message) || 'Sign-in failed. Please try again.';
}
