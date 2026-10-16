import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useDispatch, useSelector} from 'react-redux';
import {GoogleAuthProvider, signInWithPopup, signOut} from 'firebase/auth';
import {getFirebaseAuth} from '../../services/firebase';
import SocialLogin from './SocialLogin';

jest.mock('react-redux', () => ({useDispatch: jest.fn(), useSelector: jest.fn()}));
jest.mock('firebase/auth', () => ({
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({setCustomParameters: jest.fn()})),
    signInWithPopup: jest.fn(), signOut: jest.fn(),
}));
jest.mock('../../services/firebase', () => ({
    getFirebaseAuth: jest.fn(), isFirebaseConfigured: true,
    authErrorMessage: (error) => error.message,
}));
let dispatch;
beforeEach(() => {
    jest.clearAllMocks();
    GoogleAuthProvider.mockImplementation(() => ({setCustomParameters: jest.fn()}));
    dispatch = jest.fn(() => ({unwrap: () => Promise.resolve()}));
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((selector) => selector({auth: {loading: false}}));
    getFirebaseAuth.mockReturnValue({});
    signOut.mockResolvedValue();
});
test('opens Google synchronously in the click event so Safari keeps user activation', async () => {
    signInWithPopup.mockResolvedValue({user: {getIdToken: () => Promise.resolve('identity-token')}});
    const onSuccess = jest.fn();
    render(<SocialLogin onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', {name: 'Continue with Google'}));
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(signOut).toHaveBeenCalledTimes(1);
});
test('a blocked popup displays a retry message without creating an app session', async () => {
    signInWithPopup.mockRejectedValue(new Error('Allow popups for this site and try again.'));
    const onSuccess = jest.fn();
    render(<SocialLogin onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole('button', {name: 'Continue with Google'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Allow popups');
    expect(dispatch).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
});
