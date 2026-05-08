import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext(null);

const parseUser = () => {
    try {
        const raw = localStorage.getItem('userInfo');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(parseUser);

    const login = useCallback((data) => {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('userInfo');
        setUser(null);
    }, []);

    // Listen for 401 events dispatched by the API interceptor
    useEffect(() => {
        const handler = () => setUser(null);
        window.addEventListener('auth:logout', handler);
        return () => window.removeEventListener('auth:logout', handler);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
