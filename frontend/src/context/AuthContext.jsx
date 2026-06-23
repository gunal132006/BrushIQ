import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on boot
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = localStorage.getItem('brushiq_token');
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Auto login check failed:', err.message);
          localStorage.removeItem('brushiq_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await authService.login(username, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('brushiq_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err.response?.data?.message || 'Login failed';
    }
  };

  const register = async (fullName, email, phone, password) => {
    try {
      const res = await authService.register(fullName, email, phone, password);
      const { token, user: userData } = res.data;
      localStorage.setItem('brushiq_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed';
    }
  };

  const loginWithGoogle = async (googleId, email, fullName, photoUrl) => {
    try {
      const res = await authService.googleLogin(googleId, email, fullName, photoUrl);
      const { token, user: userData } = res.data;
      localStorage.setItem('brushiq_token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err.response?.data?.message || 'Google Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('brushiq_token');
    setUser(null);
  };

  const triggerForgotPassword = async (email, phone) => {
    try {
      const res = await authService.forgotPassword(email, phone);
      return res.data.message;
    } catch (err) {
      throw err.response?.data?.message || 'Forgot password request failed';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, triggerForgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
