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
    // Check for stored user on mount
    const stored = localStorage.getItem('aurea_user');
    const token = localStorage.getItem('aurea_token');
    
    if (stored && token) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
        // Set default axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('aurea_user');
        localStorage.removeItem('aurea_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // For demo purposes, using mock login
      // Replace with actual API call: const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      const mockUsers = [
        { id: 1, email: 'admin@aurea.dz', password: 'admin123', role: 'admin', name: 'Admin User' },
        { id: 2, email: 'designer@aurea.dz', password: 'designer123', role: 'designer', name: 'Designer User' }
      ];

      const found = mockUsers.find(u => u.email === email && u.password === password);
      
      if (found) {
        const userData = { 
          id: found.id, 
          email: found.email, 
          role: found.role, 
          name: found.name 
        };
        const token = 'mock-jwt-token-' + found.id;
        
        setUser(userData);
        localStorage.setItem('aurea_user', JSON.stringify(userData));
        localStorage.setItem('aurea_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true };
      }
      
      return { success: false, error: 'Email ou mot de passe incorrect' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aurea_user');
    localStorage.removeItem('aurea_token');
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