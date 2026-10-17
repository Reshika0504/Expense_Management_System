import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import ProtectedRoute from './ProtectedRoute';

jest.mock('react-redux', () => ({useDispatch: jest.fn(), useSelector: jest.fn()}));
let dispatch;
const show = (auth) => {
    useSelector.mockImplementation((selector) => selector({auth}));
    render(<MemoryRouter initialEntries={['/dashboard']}><Routes>
        <Route path="/dashboard" element={<ProtectedRoute><p>My saved dashboard</p></ProtectedRoute>} />
        <Route path="/login" element={<p>Email and Google sign-in</p>} />
    </Routes></MemoryRouter>);
};
beforeEach(() => {dispatch = jest.fn(); useDispatch.mockReturnValue(dispatch);});
test('shows a visible waiting state while restoring a session', () => {
    show({isAuthenticated: true, user: null, profileStatus: 'loading'});
    expect(screen.getByRole('status')).toHaveTextContent('Opening your space');
});
test('failed startup exposes retry without discarding the existing session', () => {
    show({isAuthenticated: true, user: null, profileStatus: 'failed', error: 'Connection unavailable'});
    expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable');
    fireEvent.click(screen.getByRole('button', {name: 'Try again'}));
    expect(dispatch).toHaveBeenCalledTimes(1);
});
test('saving a profile does not unmount an already authenticated page', () => {
    show({isAuthenticated: true, user: {id: '1'}, loading: true, profileStatus: 'succeeded'});
    expect(screen.getByText('My saved dashboard')).toBeInTheDocument();
});
test('expired session returns to login', () => {
    show({isAuthenticated: false, user: null, profileStatus: 'failed'});
    expect(screen.getByText('Email and Google sign-in')).toBeInTheDocument();
});
