import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SplashScreen from './components/SplashScreen';

// Layout and Pages
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import FamilyMembers from './pages/FamilyMembers';
import ToothbrushManagement from './pages/ToothbrushManagement';
import ScanModule from './pages/ScanModule';
import ResultScreen from './pages/ResultScreen';
import HistoryModule from './pages/HistoryModule';
import ReminderModule from './pages/ReminderModule';
import TipsModule from './pages/TipsModule';
import ProfileSettings from './pages/ProfileSettings';

// Private Route Guard
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen progressMessage="Verifying credentials..." />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen progressMessage="Initializing clinical workspace..." />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Private Protected Routes wrapped in Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout><Dashboard /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/family"
              element={
                <PrivateRoute>
                  <Layout><FamilyMembers /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/toothbrushes"
              element={
                <PrivateRoute>
                  <Layout><ToothbrushManagement /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/scan"
              element={
                <PrivateRoute>
                  <Layout><ScanModule /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/result"
              element={
                <PrivateRoute>
                  <Layout><ResultScreen /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/scans/:id"
              element={
                <PrivateRoute>
                  <Layout><ResultScreen /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <Layout><HistoryModule /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <PrivateRoute>
                  <Layout><ReminderModule /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/tips"
              element={
                <PrivateRoute>
                  <Layout><TipsModule /></Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout><ProfileSettings /></Layout>
                </PrivateRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
