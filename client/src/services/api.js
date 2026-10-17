import axios from 'axios';

export const normalizeApiBaseUrl = (value) => (value || '/api/v1').trim().replace(/;+$/, '').replace(/\/+$/, '');
export const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);
// Allow a free instance to wake up, but never leave a request pending forever.
const api = axios.create({baseURL: API_BASE_URL, timeout: 75000});
export const apiErrorMessage = (error, fallback) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        return 'We could not connect right now. Please check your connection and try again. Your saved data is safe.';
    }
    return error.response?.data?.message || fallback;
};
export default api;
