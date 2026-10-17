import api, {normalizeApiBaseUrl, apiErrorMessage} from './api';

test('an accidental semicolon in an environment URL cannot corrupt API paths', () => {
    const baseURL = normalizeApiBaseUrl(' https://api.example.com/api/v1; ');
    expect(api.getUri({baseURL, url: '/users/login'})).toBe('https://api.example.com/api/v1/users/login');
    expect(normalizeApiBaseUrl('https://api.example.com/api/v1/')).toBe('https://api.example.com/api/v1');
    expect(normalizeApiBaseUrl()).toBe('/api/v1');
});
test('network timeouts produce a recoverable explanation', () => {
    expect(apiErrorMessage({code: 'ECONNABORTED'}, 'Failed')).toContain('try again');
    expect(apiErrorMessage({response: {data: {message: 'Invalid email or password'}}}, 'Failed')).toBe('Invalid email or password');
});
