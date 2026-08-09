import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, AlertCircle, Sun, Moon, Zap, Shield, BarChart3 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
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

  return (
    <div className={`min-h-screen w-full flex relative transition-colors duration-200 ${
      darkMode ? 'bg-[#090d17]' : 'bg-slate-50'
    }`}>

      {/* Theme Toggle — top right */}
      <div className="absolute top-5 right-6 z-20">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer border ${
            darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* LEFT — Hero / Brand Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-primary via-[#1a6fe8] to-secondary">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-white/20">
            B
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none m-0">BrushIQ</h1>
            <p className="text-white/60 text-[11px] font-semibold mt-0.5">AI Oral Healthcare Platform</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Smart Bristle<br />
            Wear Analysis<br />
            <span className="text-white/70">At Your Fingertips</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Upload or capture your toothbrush and get an instant AI-powered wear assessment, replacement alerts, and personalised hygiene tips.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            {[
              { icon: Zap, text: 'Instant AI bristle wear detection' },
              { icon: Shield, text: 'Family profile management' },
              { icon: BarChart3, text: 'Scan history & trend analytics' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/15">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-sm font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">© 2026 BrushIQ. All rights reserved.</p>
      </div>

      {/* RIGHT — Login Form Panel */}
      <div className={`flex-1 flex flex-col items-center justify-center px-8 py-12 overflow-y-auto ${
        darkMode ? 'bg-[#0b0f19] text-slate-100' : 'bg-white text-slate-900'
      }`}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-lg">B</div>
            <h1 className="text-lg font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent m-0">BrushIQ</h1>
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-1">Welcome back</h2>
          <p className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sign in to your BrushIQ account
          </p>

          {error && (
            <div id="error-message" role="alert" className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-900/40 p-3 rounded-xl mb-6 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                Email or Phone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email-input"
                  name="username"
                  type="text"
                  placeholder="name@domain.com or +123456"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none font-semibold text-sm transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 focus:border-primary text-white'
                      : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className={`block text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-[10px] text-primary font-bold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none font-semibold text-sm transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 focus:border-primary text-white'
                      : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          <p className={`text-center text-sm font-semibold mt-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-bold">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
