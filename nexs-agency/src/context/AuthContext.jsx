// TODO: Replace console.error with Sentry or proper error tracking
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

/**
 * Decode JWT payload and check expiration.
 * Returns false if token is missing, malformed, or expired.
 */
function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds, Date.now() in ms
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(() => {
        const stored = localStorage.getItem('token');
        if (stored && !isTokenValid(stored)) {
            localStorage.removeItem('token');
            return null;
        }
        return stored;
    });

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const handleForceLogout = () => logout();
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, [logout]);

    useEffect(() => {
        let cancelled = false;
        const storedToken = localStorage.getItem('token');
        if (token && storedToken && isTokenValid(storedToken)) {
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
            if (token) logout(); // token exists but is expired/invalid
            setLoading(false);
        }
        return () => { cancelled = true; };
    }, [token, logout]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.signin({ email, password });
            const { token: newToken, user: newUser } = response.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(newUser);
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
            const { token: newToken, user: newUser } = response.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(newUser);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Signup failed'
            };
        }
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
