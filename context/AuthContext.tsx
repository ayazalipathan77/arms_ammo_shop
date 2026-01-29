import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'ARTIST' | 'USER';
}

interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    fullName: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, role?: string) => void;
    logout: () => void;
    register: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

const decodeToken = (token: string): User | null => {
    try {
        const decoded: JWTPayload = jwtDecode(token);
        return {
            id: decoded.userId,
            email: decoded.email,
            fullName: decoded.fullName,
            role: (decoded.role as 'ADMIN' | 'ARTIST' | 'USER') || 'USER',
        };
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            const decodedUser = decodeToken(storedToken);
            if (decodedUser) {
                setToken(storedToken);
                setUser(decodedUser);
            } else {
                localStorage.removeItem('authToken');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, role?: string) => {
        setToken(newToken);
        localStorage.setItem('authToken', newToken);

        const decodedUser = decodeToken(newToken);
        if (decodedUser) {
            setUser(decodedUser);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
    };

    const register = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('authToken', newToken);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
                register,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
