import {act, render, screen} from '@testing-library/react';
import ConnectionNotice from './ConnectionNotice';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test('a slow connection gets an explanation, then clears when finished', () => {
    const {rerender} = render(<ConnectionNotice loading />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(8000));
    expect(screen.getByRole('status')).toHaveTextContent('Still connecting');
    rerender(<ConnectionNotice loading={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
