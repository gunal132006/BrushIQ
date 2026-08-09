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
      if (!err.response) {
        throw 'Network Error: Unable to reach BrushIQ server. Please check your internet connection.';
      }
      const status = err.response.status;
      const message = err.response?.data?.message;

      if (status === 401) {
        throw message || 'Invalid email/phone or password.';
      } else if (status === 429) {
        throw message || 'Too many authentication attempts. Please try again later.';
      } else if (status === 503) {
        throw message || 'Database service temporarily unavailable. Please try again in a moment.';
      } else if (status === 400) {
        throw message || 'Invalid credentials or missing required fields.';
      } else {
        throw message || 'Server error during login. Please try again.';
      }
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
      if (!err.response) {
        throw 'Network Error: Unable to reach BrushIQ server. Please check your internet connection.';
      }
      const status = err.response.status;
      const message = err.response?.data?.message;

      if (status === 400) {
        throw message || 'Registration failed. Please verify your details.';
      } else if (status === 429) {
        throw message || 'Too many registration attempts. Please try again later.';
      } else if (status === 503) {
        throw message || 'Database service temporarily unavailable. Please try again in a moment.';
      } else {
        throw message || 'Server error during registration. Please try again.';
      }
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const res = await authService.googleLogin(idToken);
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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      return res.data.message;
    } catch (err) {
      throw err.response?.data?.message || 'Password update failed';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, triggerForgotPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
