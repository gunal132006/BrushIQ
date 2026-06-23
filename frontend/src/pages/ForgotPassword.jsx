import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';

const ForgotPassword = () => {
  const { triggerForgotPassword } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [username, setUsername] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username) {
      return setError('Please enter email address or phone number');
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const isEmail = username.includes('@');
      const message = await triggerForgotPassword(
        isEmail ? username : null,
        !isEmail ? username : null
      );
      setSuccessMessage(message);
    } catch (err) {
      setError(err || 'Failed to request password reset code');
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

        <div className="mb-4 text-left shrink-0">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center my-auto">
          {/* Logo Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary/20 mb-3">
              ?
            </div>
            <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-slate-450 dark:text-slate-400 mt-1.5 text-xs text-center font-semibold">
              Recover access to your BrushIQ account
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/40 p-3 rounded-xl mb-5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center text-teal-500">
                <CheckCircle className="w-14 h-14 animate-bounce" />
              </div>
              <h3 className="text-lg font-black">Request Dispatched!</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                {successMessage}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-block px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
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

              <button
                type="submit"
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/10 flex items-center justify-center cursor-pointer disabled:opacity-50 mt-2"
                disabled={loading}
              >
                {loading ? 'Sending Request...' : 'Send Recovery Code'}
              </button>
            </form>
          )}
        </div>

        <div className="h-6 shrink-0" />
      </div>
    </div>
  );
};

export default ForgotPassword;
