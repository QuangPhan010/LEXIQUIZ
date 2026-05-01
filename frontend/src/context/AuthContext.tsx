import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // For simplicity, we just assume the token is valid if it exists
      // In a real app, you'd verify it with a /me endpoint
      setUser({ authenticated: true });
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login/', credentials);
    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    setUser({ authenticated: true });
  };

  const register = async (data: any) => {
    await api.post('/auth/register/', data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
