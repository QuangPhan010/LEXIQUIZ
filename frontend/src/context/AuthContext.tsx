import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me/');
      const userData = response.data;
      // Append cache buster to avatar to ensure immediate update in Navbar after change
      if (userData.avatar && !userData.avatar.includes('?v=')) {
        userData.avatar = `${userData.avatar}?v=${new Date().getTime()}`;
      }
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (credentials: any) => {
    const response = await api.post('/auth/login/', credentials);
    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refresh', response.data.refresh);
    await fetchUser();
  };

  const register = async (data: any) => {
    await api.post('/auth/register/', data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
