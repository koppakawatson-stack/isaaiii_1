import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  LayoutDashboard, Users, Columns, MessageSquare, Trophy, LogOut, Briefcase, 
  Calendar, ClipboardList, BarChart3, Settings, Sparkles 
} from 'lucide-react';

function Sidebar({ activePage, setActivePage }) {
  const { user, logout } = useAuth();
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  const fetchPendingTasks = async () => {
    try {
      const res = await api.get('/communications/followups?completed=false');
      if (res.success) {
        setPendingTasksCount(res.data.length);
      }
    } catch (err) {
      console.error('Sidebar error fetching pending tasks count:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingTasks();
      const interval = setInterval(fetchPendingTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'leads', label: 'Leads', icon: <Users className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'pipeline', label: 'Pipeline Board', icon: <Columns className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'communications', label: 'Communications', icon: <MessageSquare className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'performance', label: 'Team Performance', icon: <Trophy className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'tasks', label: 'Tasks / Follow-ups', icon: <ClipboardList className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'], badge: true },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, roles: ['Admin', 'Manager', 'BDA'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="w-64 bg-[#0b0f19] border-r border-[#1a2035] flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-400 select-none z-30 font-sans">
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Header Branding */}
        <div className="p-6 border-b border-[#1a2035] flex items-center gap-3">
          <div className="p-2 bg-indigo-650/10 rounded-xl border border-indigo-500/25">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-wider uppercase">BDA Console</h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block -mt-0.5">Manufacturing CRM</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-grow px-4 py-6 space-y-1.5">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide uppercase transition-all duration-155 cursor-pointer ${
                activePage === item.id 
                  ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-450 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && pendingTasksCount > 0 && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Upgrade Plan Mockup Card & Profile */}
      <div className="p-4 border-t border-[#1a2035] space-y-4">
        {/* Upgrade Plan Card */}
        <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border border-indigo-500/10 rounded-2xl text-center space-y-2.5">
          <div className="inline-flex p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-200">Upgrade Plan</h5>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Access advanced AI forecasting & email builders</p>
          </div>
          <button className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition cursor-pointer">
            Go Premium
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between gap-3 bg-slate-900/20 p-2.5 rounded-xl border border-[#1a2035]/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8.5 h-8.5 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-650 to-purple-650 flex items-center justify-center font-bold text-white text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 select-none">
              <h4 className="font-bold text-[11px] text-slate-200 truncate">{user?.name}</h4>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 hover:bg-red-500/15 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
