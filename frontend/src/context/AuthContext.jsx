import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const stored = sessionStorage.getItem('aurea_user');
      const token = sessionStorage.getItem('aurea_token');

      if (stored && token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token is actually valid by pinging backend
          const response = await axios.get(`${API_BASE_URL}/auth/profile`);
          
          if (response.data && response.data.user) {
            setUser(response.data.user);
          } else {
            throw new Error("Invalid session verification");
          }
        } catch (e) {
          console.error("Session verification failed, logging out", e);
          sessionStorage.removeItem('aurea_user');
          sessionStorage.removeItem('aurea_token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
    
    // Setup Axios interceptor to handle 401s anywhere in the app
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          sessionStorage.removeItem('aurea_user');
          sessionStorage.removeItem('aurea_token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { user: userData, token } = response.data;

      setUser(userData);
      sessionStorage.setItem('aurea_user', JSON.stringify(userData));
      sessionStorage.setItem('aurea_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Email ou mot de passe incorrect'
      };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('aurea_user');
    sessionStorage.removeItem('aurea_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}