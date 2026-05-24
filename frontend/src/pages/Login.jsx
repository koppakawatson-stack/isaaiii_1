import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Mail, Lock, User, ShieldAlert } from 'lucide-react';

function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'BDA'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.role);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">
      {/* Left side: Factory Background Overlay */}
      <div 
        className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col justify-between p-16 text-white bg-cover bg-center select-none"
        style={{ backgroundImage: `url('/factory_login_bg.png')` }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40 z-0"></div>

        {/* Branding header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/25">
            <Briefcase className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-base tracking-wider uppercase">Antigravity CRM</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block -mt-0.5">Enterprise BDA</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              BDA Management System
            </h1>
            <p className="text-slate-350 text-base leading-relaxed">
              Streamline leads. Track sales. Grow your business. Monitor your team performance and maximize conversion rates with intelligent workflow tooling.
            </p>
          </div>

          <div className="space-y-5 pt-4">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-550/15 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Lead Management</h4>
                <p className="text-xs text-slate-400 mt-0.5">Capture and manage quality leads efficiently throughout their lifecycle.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-550/15 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Sales Pipeline</h4>
                <p className="text-xs text-slate-400 mt-0.5">Track your deals and opportunities visually with native Kanban boards.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-amber-550/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Team Performance</h4>
                <p className="text-xs text-slate-400 mt-0.5">Monitor representative metrics and boost overall team productivity.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} Antigravity Systems. All rights reserved.
        </div>
      </div>

      {/* Right side: White Login Card Panel */}
      <div className="w-full lg:w-[45%] xl:w-[40%] bg-white flex items-center justify-center p-8 sm:p-16 text-slate-800 relative">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome Back! 👋' : 'Create Account'}
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              {isLogin ? 'Login to continue to your account' : 'Register your profile in the CRM system'}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-650" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-900 placeholder-slate-450 text-sm focus:ring-4 focus:ring-indigo-500/10 font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-900 placeholder-slate-450 text-sm focus:ring-4 focus:ring-indigo-500/10 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-900 placeholder-slate-450 text-sm focus:ring-4 focus:ring-indigo-500/10 font-medium"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">System Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-900 focus:ring-4 focus:ring-indigo-500/10 text-sm font-medium cursor-pointer"
                >
                  <option value="BDA">Business Development Associate (BDA)</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer text-slate-650">
                  <input type="checkbox" className="rounded text-indigo-650 focus:ring-indigo-550 border-slate-300 w-4 h-4 cursor-pointer" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="text-indigo-600 hover:text-indigo-500 transition">Forgot password?</a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 focus:outline-none focus:ring-4 focus:ring-indigo-550/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>{isLogin ? 'Login' : 'Register Account'}</span>
              )}
            </button>
          </form>

          {/* Footer toggle */}
          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            <span>
              {isLogin ? "Don't have an account? " : 'Already registered? '}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-650 hover:text-indigo-500 font-bold underline transition cursor-pointer ml-1"
            >
              {isLogin ? 'Register here' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
