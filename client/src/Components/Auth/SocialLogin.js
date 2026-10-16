import {useRef, useState, useEffect} from 'react';
import {GoogleAuthProvider, signInWithPopup, signOut} from 'firebase/auth';
import {useDispatch, useSelector} from 'react-redux';
import {firebaseLogin} from '../../redux/slices/authSlice';
import {getFirebaseAuth, isFirebaseConfigured, authErrorMessage} from '../../services/firebase';

export default function SocialLogin({onSuccess}) {
    const dispatch = useDispatch();
    const {loading} = useSelector((state) => state.auth);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    const googleLogin = async () => {
        setError(''); setBusy(true);
        let auth;
        try {
            auth = await getFirebaseAuth();
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({prompt: 'select_account'});
            const credential = await signInWithPopup(auth, provider);
            const idToken = await credential.user.getIdToken();
            await dispatch(firebaseLogin({idToken})).unwrap();
            if (mounted.current) onSuccess();
        } catch (error) {
            if (mounted.current) setError(authErrorMessage(error));
        } finally {
            if (auth) await signOut(auth).catch(() => {});
            if (mounted.current) setBusy(false);
        }
    };
    return (
        <div className="social-login">
            <div className="auth-divider">or</div>
            <button type="button" className="secondary-button" onClick={googleLogin} disabled={loading || busy || !isFirebaseConfigured}>
                {busy ? 'Signing in with Google…' : 'Continue with Google'}
            </button>
            {!isFirebaseConfigured && <p className="auth-help">Google sign-in is being set up. Please use email and password.</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
        </div>
    );
}
