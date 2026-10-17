import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Link, Navigate, useLocation} from 'react-router-dom';
import {getProfile} from '../../redux/slices/authSlice';
import Spinner from '../Spinner';
import ConnectionNotice from './ConnectionNotice';

export default function ProtectedRoute({children}) {
    const {isAuthenticated, user, profileStatus, error} = useSelector((state) => state.auth);
    const location = useLocation();
    const dispatch = useDispatch();
    if (!isAuthenticated) return <Navigate to="/login" state={{from: location}} replace />;
    if (!user) {
        return <main className="connection-page">
            <div className="finance-card connection-card">
                {profileStatus === 'failed' ? <>
                    <span className="connection-symbol" aria-hidden="true">↻</span>
                    <h1>Let's try that again.</h1>
                    <p role="alert">{error || 'We could not open your space just yet.'}</p>
                    <button className="primary-button" onClick={() => dispatch(getProfile())}>Try again</button>
                    <Link to="/">Back to home</Link>
                </> : <><Spinner /><ConnectionNotice loading /></>}
            </div>
        </main>;
    }
    return children;
}
