import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Bell, Calendar, User, CheckCircle2, ShieldAlert, Sun, Moon, X } from 'lucide-react';
import { io } from 'socket.io-client';

function Navbar({ activePage, setActivePage }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const fetchFollowups = async () => {
    try {
      const res = await api.get('/communications/followups?completed=false');
      if (res.success) {
        // Filter those due today or overdue
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const urgentTasks = res.data.filter(item => {
          return new Date(item.followUpDate) <= today;
        });

        setNotifications(urgentTasks);
        setUnreadCount(urgentTasks.length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchFollowups();
    
    // Connect Socket.io client
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('Socket client initialized on frontend');
    });

    socket.on('notification', (data) => {
      const toastId = Date.now();
      setToasts(prev => [...prev, { ...data, id: toastId }]);
      setUnreadCount(prev => prev + 1);
      
      // Reload followups to check for new alerts
      fetchFollowups();

      // Auto close toast after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Executive Dashboard';
      case 'leads': return 'Lead Database';
      case 'pipeline': return 'Sales Pipeline';
      case 'communications': return 'Client Communication Logs';
      case 'performance': return 'BDA Leaderboard';
      case 'tasks': return 'Tasks & Follow-ups';
      case 'calendar': return 'Interactive Calendar';
      case 'reports': return 'Reports & Specification Catalog';
      case 'settings': return 'Console Settings';
      default: return 'Management Console';
    }
  };

  const handleNotificationClick = (leadId) => {
    setIsDropdownOpen(false);
    if (leadId) {
      setActivePage('communications');
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 font-sans">
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto p-4 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-start gap-3 w-80 animate-slide-up glass-panel">
            <div className={`p-2 rounded-xl border ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              toast.type === 'danger' ? 'bg-red-50 text-red-650 border-red-100' :
              toast.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left space-y-0.5 min-w-0">
              <h4 className="font-extrabold text-xs text-slate-800 truncate">{toast.title}</h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6">
        <h2 className="font-bold text-lg text-slate-800">{getPageTitle()}</h2>
        
        {/* Search bar mockup */}
        <div className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 w-64 gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-xs text-slate-700 w-full placeholder-slate-450 font-medium" />
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Date Filter Mockup */}
        <div className="hidden lg:flex items-center gap-2">
          <select className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer outline-none">
            <option>This Month</option>
            <option>Last Month</option>
          </select>
          <span className="text-xs text-slate-455 font-semibold">01 May 2026 - 31 May 2026</span>
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition duration-150 cursor-pointer"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5 text-yellow-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-650" />}
        </button>

        {/* Notifications Icon */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition duration-150 relative cursor-pointer ${
            isDropdownOpen ? 'bg-slate-100 text-slate-800' : ''
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-650 text-[10px] font-black text-white flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User profile avatar badge mockup */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-650 to-purple-650 flex items-center justify-center font-bold text-white text-xs select-none">
            W
          </div>
          <div className="hidden sm:block text-left select-none">
            <h5 className="text-xs font-bold text-slate-800 leading-none">Watson J.</h5>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">BDA Executive</span>
          </div>
        </div>

        {/* Notifications Dropdown Drawer */}
        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
            <div className="absolute right-0 top-12 w-80 glass-panel rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Urgent Reminders</span>
                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-650 px-1.5 py-0.5 rounded font-bold uppercase">
                  {unreadCount} Alerts
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 italic flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-400" />
                    <span>No overdue tasks for today!</span>
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item.leadId?._id)}
                      className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition cursor-pointer text-left space-y-1 relative"
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="font-bold text-[11px] text-slate-850 truncate max-w-[170px]">
                          {item.leadId?.companyName}
                        </span>
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      </div>
                      
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>

                      <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-1 font-semibold border-t border-slate-200/60">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {new Date(item.followUpDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
