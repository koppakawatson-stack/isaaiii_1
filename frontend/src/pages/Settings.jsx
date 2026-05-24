import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Sun, Moon, Shield, ListTodo, Activity, Clock, ShieldCheck } from 'lucide-react';

function Settings() {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs');
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Console Settings</h1>
          <p className="text-slate-550 text-sm">Configure console themes, manage profiles, and inspect DB security logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile & Preferences */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Details Card */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm bg-white">
            <div className="border-b border-slate-100 pb-3 mb-4 text-left">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-650" />
                <span>Representative Profile</span>
              </h3>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3.5 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-650 to-purple-650 flex items-center justify-center font-bold text-white text-sm select-none">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-850">{user?.name}</h4>
                  <span className="text-[10px] font-black text-slate-455 uppercase tracking-wide bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100">{user?.role}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 font-semibold px-1">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-455 uppercase tracking-wider">Email Address</span>
                  <span className="text-slate-800">{user?.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-455 uppercase tracking-wider">System ID</span>
                  <span className="text-slate-800 font-mono text-[10px]">{user?._id || user?.id || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm bg-white">
            <div className="border-b border-slate-100 pb-3 mb-4 text-left">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-650" />
                <span>Console Preferences</span>
              </h3>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-150 text-left">
              <div>
                <span className="block text-xs font-bold text-slate-800">Console Color Theme</span>
                <span className="text-[10px] text-slate-455 font-medium">Toggle between Light and Dark skins</span>
              </div>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-slate-150 border border-slate-200 rounded-xl transition text-slate-600 hover:text-slate-800 cursor-pointer"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-4.5 h-4.5 text-yellow-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Security Audit Logs */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm bg-white min-h-[300px]">
          <div className="border-b border-slate-100 pb-3 mb-4 text-left flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Console Activity Logs</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg select-none">
              <Clock className="w-3.5 h-3.5" />
              <span>Audit Trail (Last 100)</span>
            </span>
          </div>

          {loading ? (
            <div className="flex-grow flex items-center justify-center py-12">
              <span className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex-grow flex items-center justify-center py-12 text-slate-500 italic text-xs">
              No recent console activities tracked.
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto max-h-[420px] pr-1 space-y-2.5 scrollbar-thin text-left">
              {logs.map(log => (
                <div key={log._id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl transition duration-150 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        log.action.includes('CREATE') ? 'bg-indigo-50 text-indigo-650 border-indigo-100' :
                        log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        log.action.includes('DELETE') ? 'bg-red-50 text-red-650 border-red-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-455 font-bold">by {log.userName}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">{log.details}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold shrink-0">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Minimal import block matching
import { SlidersHorizontal } from 'lucide-react';

export default Settings;
