import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Briefcase, DollarSign, Target, Award, Calendar, Bell, ArrowUpRight, TrendingUp, CheckSquare, Square } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f59e0b', '#ef4444'];

function Dashboard({ setActivePage }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentFollowups, setRecentFollowups] = useState([]);
  const [activities, setActivities] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/analytics/dashboard');
      if (statsRes.success) {
        setStats(statsRes.data);
      }

      const followupsRes = await api.get('/communications/followups?completed=false');
      if (followupsRes.success) {
        setRecentFollowups(followupsRes.data.slice(0, 4)); // show top 4
      }

      const logsRes = await api.get('/activity-logs');
      if (logsRes.success) {
        setActivities(logsRes.data.slice(0, 4)); // show top 4
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (id) => {
    try {
      const res = await api.put(`/communications/followup/${id}/toggle`);
      if (res.success) {
        setRecentFollowups(recentFollowups.filter(f => f._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
          <span className="text-slate-455 text-sm font-semibold">Aggregating real-time database stats...</span>
        </div>
      </div>
    );
  }

  // Prep stage counts data for Recharts Bar Chart
  const barChartData = stats && stats.statusCounts ? [
    { name: 'New', count: stats.statusCounts.New || 0 },
    { name: 'Contacted', count: stats.statusCounts.Contacted || 0 },
    { name: 'Follow-up', count: stats.statusCounts.FollowUp || 0 },
    { name: 'Negotiation', count: stats.statusCounts.Negotiation || 0 },
    { name: 'Won', count: stats.statusCounts.Won || 0 },
    { name: 'Lost', count: stats.statusCounts.Lost || 0 }
  ] : [];

  // Prep lead source donut data
  const pieChartData = stats && stats.sourceCounts ? [
    { name: 'Website', value: stats.sourceCounts.Website || 0 },
    { name: 'Referral', value: stats.sourceCounts.Referral || 0 },
    { name: 'Exhibition', value: stats.sourceCounts.Exhibition || 0 },
    { name: 'Cold Call', value: stats.sourceCounts.ColdCall || 0 },
    { name: 'Others', value: stats.sourceCounts.Others || 0 }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6 font-sans animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-left">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
            Welcome back, {user?.name}
          </h1>
          <p className="text-slate-500 text-sm font-semibold">
            Here's what is happening across your {user?.role === 'BDA' ? 'assigned' : 'company'} BDA pipeline today.
          </p>
        </div>
        <div className="text-[10px] bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-650 font-black self-start md:self-auto uppercase tracking-wider">
          Session Role: {user?.role}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white hover-scale">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Leads</span>
            <span className="text-3xl font-extrabold text-slate-850">{stats?.totalLeads}</span>
            <span className="text-[10px] text-emerald-650 font-bold block">▲ 16.5% <span className="text-slate-400 font-semibold">vs last month</span></span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Pipeline */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white hover-scale">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Deals</span>
            <span className="text-3xl font-extrabold text-slate-850">{stats?.statusCounts?.Contacted + stats?.statusCounts?.Negotiation || 0}</span>
            <span className="text-[10px] text-emerald-650 font-bold block">▲ 10.2% <span className="text-slate-400 font-semibold">vs last month</span></span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Closed Won */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white hover-scale">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Revenue Generated</span>
            <span className="text-3xl font-extrabold text-emerald-600">${(stats?.revenue?.won || 0).toLocaleString()}</span>
            <span className="text-[10px] text-emerald-650 font-bold block">▲ 22.7% <span className="text-slate-400 font-semibold">vs last month</span></span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm bg-white hover-scale">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Conversion Rate</span>
            <span className="text-3xl font-extrabold text-purple-650">{stats?.conversionRate}%</span>
            <span className="text-[10px] text-emerald-650 font-bold block">▲ 6.3% <span className="text-slate-400 font-semibold">vs last month</span></span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-650 rounded-xl border border-purple-100 shrink-0">
            <Target className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart: Leads Overview */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leads Overview</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Revenue ($)</span>
          </div>
          <div className="h-64 w-full">
            {!stats?.monthlySales || stats.monthlySales.length === 0 || stats.monthlySales.reduce((a, b) => a + b.revenue, 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No revenue logs available. Win deals to plot.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.monthlySales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                    itemStyle={{ color: '#6366f1' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Revenue Overview */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Revenue Overview</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Leads</span>
          </div>
          <div className="h-64 w-full">
            {stats?.totalLeads === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No leads registered. Add leads to plot.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                    itemStyle={{ color: '#6366f1' }}
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[5, 5, 0, 0]} name="Leads Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Layout: Donut Chart, Activities log, Tasks checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Source Donut Chart */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-80 shadow-sm bg-white hover-scale">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 text-left">Lead Source</h3>
          
          <div className="h-44 w-full relative">
            {pieChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No source tags.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legends list */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2 border-t border-slate-100 text-[9px] font-extrabold text-slate-500 uppercase">
            {pieChartData.map((item, idx) => (
              <span key={item.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activities Log */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-80 shadow-sm bg-white hover-scale">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 text-left">Recent Activities</h3>
          
          <div className="flex-grow overflow-y-auto space-y-3 pr-1 text-left scrollbar-thin">
            {activities.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No activity logs.
              </div>
            ) : (
              activities.map(log => (
                <div key={log._id} className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    log.action.includes('CREATE') ? 'bg-indigo-600 animate-pulse' :
                    log.action.includes('UPDATE') ? 'bg-amber-500' :
                    log.action.includes('DELETE') ? 'bg-red-500' :
                    'bg-slate-400'
                  }`}></span>
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-700 font-bold leading-normal">{log.details}</p>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      {new Date(log.timestamp).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Due Soon Checklist */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-80 shadow-sm bg-white hover-scale">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left">Tasks Due Soon</h3>
            <button
              onClick={() => setActivePage('tasks')}
              className="text-[10px] text-indigo-650 hover:underline font-bold uppercase tracking-wider cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 text-left scrollbar-thin">
            {recentFollowups.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No pending tasks due.
              </div>
            ) : (
              recentFollowups.map(task => (
                <div key={task._id} className="flex items-start gap-2.5 p-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition duration-100">
                  <button
                    onClick={() => handleToggleTask(task._id)}
                    className="p-0.5 hover:bg-slate-150 rounded text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0 mt-0.5"
                    title="Mark Completed"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[10px] text-slate-800 truncate block max-w-[120px]">{task.leadId?.companyName}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border uppercase shrink-0 ${
                        task.leadId?.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                        task.leadId?.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {task.leadId?.priority || 'Medium'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold truncate leading-normal">{task.summary}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
