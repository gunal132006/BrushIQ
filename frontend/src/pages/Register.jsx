import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Phone, Lock, AlertCircle, Sun, Moon } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !password) {
      return setError('Name and Password are required');
    }
    if (!email && !phone) {
      return setError('Please provide either an Email or Phone number');
    }

    setError('');
    setLoading(true);

    try {
      await register(fullName, email, phone, password);
      navigate('/');
    } catch (err) {
      setError(err || 'Registration failed');
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
          <div className="flex flex-col items-center mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/20 mb-3">
              B
            </div>
            <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="text-slate-450 dark:text-slate-400 mt-1 text-xs text-center font-semibold">
              Get started with bristle wear analysis
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/40 p-3 rounded-xl mb-4 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-white border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-white border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-white border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
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
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10 flex items-center justify-center cursor-pointer disabled:opacity-50 mt-4"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-400 mt-5 shrink-0">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-bold">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
