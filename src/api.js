import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005',
});

API.interceptors.request.use((req) => {
    const raw = localStorage.getItem('userInfo');
    if (raw) {
        try {
            const userInfo = JSON.parse(raw);
            if (userInfo?.token) {
                req.headers.Authorization = `Bearer ${userInfo.token}`;
            }
        } catch (_) {}
    }
    return req;
});

API.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('userInfo');
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(err);
    }
);

export default API;
