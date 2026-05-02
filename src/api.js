import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
});

// Automatically add authorization header if user is logged in
API.interceptors.request.use((req) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
        req.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return req;
});

export default API;
