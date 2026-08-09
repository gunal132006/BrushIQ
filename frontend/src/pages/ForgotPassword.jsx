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
    <div className={`min-h-screen w-full flex items-center justify-center relative transition-colors duration-200 ${
      darkMode ? 'bg-[#090d17] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>

      {/* Theme Toggle */}
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

      {/* Centered Card */}
      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-xl ${
        darkMode ? 'bg-[#0b0f19] border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors font-bold mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/20">
            ?
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight m-0">Reset Password</h2>
            <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recover access to your BrushIQ account</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-900/40 p-3 rounded-xl mb-5 text-xs font-semibold">
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
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{successMessage}</p>
            <div className="pt-4">
              <Link to="/login" className="inline-block px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md">
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
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending Request...' : 'Send Recovery Code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
