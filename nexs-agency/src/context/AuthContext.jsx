// TODO: Replace console.error with Sentry or proper error tracking
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        let cancelled = false;
        const storedToken = localStorage.getItem('token');
        if (token && storedToken) {
            const doFetch = async () => {
                try {
                    const response = await authAPI.getMe();
                    if (!cancelled) setUser(response.data.user);
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    if (!cancelled) logout();
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };
            doFetch();
        } else {
            setLoading(false);
        }
        return () => { cancelled = true; };
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.signin({ email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const signup = async (userData) => {
        try {
            const response = await authAPI.signup(userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Signup failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
