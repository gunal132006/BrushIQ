import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, AlertCircle, Sun, Moon } from 'lucide-react';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      return setError('Please enter email/phone and password');
    }
    
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err || 'Failed to authenticate user');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const mockGoogleId = 'g_' + Math.random().toString(36).substring(2, 11);
      const mockEmail = 'user.' + Math.random().toString(36).substring(2, 7) + '@gmail.com';
      await loginWithGoogle(mockGoogleId, mockEmail, 'John Doe', '');
      navigate('/');
    } catch (err) {
      setError(err || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-250 ${
      darkMode ? 'bg-slate-950' : 'bg-slate-100'
    }`}>
      {/* Centered Mobile Container Mockup */}
      <div className={`relative max-w-[480px] w-full min-h-screen md:min-h-[850px] md:h-[850px] flex flex-col justify-between p-6 overflow-y-auto md:rounded-[36px] md:shadow-2xl border-x ${
        darkMode 
          ? 'bg-[#0b0f19] border-slate-800 text-slate-100 shadow-[#000000_0px_25px_50px_-12px]' 
          : 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-300'
      }`}>
        
        {/* Floating Theme Toggle */}
        <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer border ${
              darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center my-auto">
          {/* Logo Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary/20 mb-3">
              B
            </div>
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BrushIQ
            </h2>
            <p className="text-slate-450 dark:text-slate-400 mt-1.5 text-xs text-center font-semibold uppercase tracking-wider">
              AI Oral Healthcare Platform
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/40 p-3 rounded-xl mb-5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email or Phone</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="name@domain.com or +123456"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-white border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-[10px] text-primary font-bold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-white border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10 flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-slate-200 dark:border-slate-850 w-full"></div>
            <span className={`absolute px-3.5 text-[9px] font-bold uppercase tracking-widest ${
              darkMode ? 'bg-[#0b0f19] text-slate-400' : 'bg-slate-50 text-slate-400'
            }`}>
              Or Continue With
            </span>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
              darkMode 
                ? 'border-slate-850 hover:bg-slate-800 bg-slate-950 text-white' 
                : 'border-slate-200 hover:bg-slate-100 bg-white text-slate-700'
            }`}
            disabled={loading}
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.48 0-6.3-2.82-6.3-6.3s2.82-6.3 6.3-6.3c1.64 0 3.09.63 4.22 1.66l3.1-3.1C19.12 2.215 15.93 1 12.24 1 5.67 1 1.05 5.62 1.05 12.2s4.62 11.2 11.19 11.2c7.53 0 11.08-5.385 10.2-11.2h-10.2z"
              />
            </svg>
            Google Sign In
          </button>
        </div>

        <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-400 mt-6 shrink-0">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-bold">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
