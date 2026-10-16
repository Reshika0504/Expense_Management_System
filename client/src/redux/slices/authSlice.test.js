import reducer, {getProfile, firebaseLogin} from './authSlice';

const session = {user: {id: 'user-1'}, token: 'token', isAuthenticated: true, loading: false, error: null};
afterEach(() => localStorage.clear());
test('temporary network or server failures preserve the existing session', () => {
    for (const status of [undefined, 500, 503]) {
        const result = reducer(session, getProfile.rejected(null, 'request', undefined, {status, message: 'Try again'}));
        expect(result.token).toBe('token');
        expect(result.isAuthenticated).toBe(true);
    }
});
test('expired tokens and deleted accounts clear the session', () => {
    for (const status of [401, 403, 404]) {
        localStorage.setItem('token', 'token');
        const result = reducer(session, getProfile.rejected(null, 'request', undefined, {status, message: 'Invalid session'}));
        expect(result.isAuthenticated).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
    }
});
test('Google login uses the same application session as email login', () => {
    const result = reducer(undefined, firebaseLogin.fulfilled({token: 'google-session', user: {id: 'user-1'}}, 'request'));
    expect(result.token).toBe('google-session');
    expect(result.user.id).toBe('user-1');
    expect(result.isAuthenticated).toBe(true);
});
