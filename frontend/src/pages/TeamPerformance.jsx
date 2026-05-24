import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Trophy, Medal, Users, DollarSign, Target } from 'lucide-react';

const RANK_BADGES = {
  1: <Medal className="w-5.5 h-5.5 text-yellow-600 animate-bounce" title="Gold Medalist" />,
  2: <Medal className="w-5.5 h-5.5 text-slate-400" title="Silver Medalist" />,
  3: <Medal className="w-5.5 h-5.5 text-amber-700" title="Bronze Medalist" />,
};

function TeamPerformance() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/performance/leaderboard');
      if (res.success) {
        setLeaderboard(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leaderboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
          <span className="text-slate-500 text-sm font-semibold">Compiling team performance metrics...</span>
        </div>
      </div>
    );
  }

  // Prep data for Recharts Comparison Chart (Revenue by rep)
  const chartData = leaderboard.map(item => ({
    name: item.employee.name,
    Revenue: item.revenue,
    Deals: item.wonLeads
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Team Performance</h1>
        <p className="text-slate-550 text-sm">Monitor closed deal metrics, sales values, and client interaction statistics for BDAs.</p>
      </div>

      {/* Grid Overview Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Rep Card */}
        {leaderboard.length > 0 && (
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between h-48 lg:col-span-1 shadow-sm">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-500 rounded-full blur-2xl opacity-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Top Performer</span>
                <span className="font-bold text-slate-800 text-base">{leaderboard[0].employee.name}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-2xl font-extrabold text-emerald-600">${leaderboard[0].revenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">Revenue Generated</span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 mt-2 font-bold uppercase">
              <span>Conversion: <span className="text-slate-700 font-extrabold">{leaderboard[0].conversionRate}%</span></span>
              <span>Won: <span className="text-slate-700 font-extrabold">{leaderboard[0].wonLeads} deals</span></span>
            </div>
          </div>
        )}

        {/* Chart comparing reps side-by-side */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between h-48 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Revenue Comparison</h3>
            <span className="text-[10px] text-slate-400 uppercase font-bold">USD ($)</span>
          </div>
          <div className="h-32 w-full">
            {chartData.length === 0 || chartData.reduce((a, b) => a + b.Revenue, 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No deal conversion data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={9} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Sales Leaderboard Ranking</h3>
          <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{leaderboard.length} Representatives</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-650">
            <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Logs/Activity</th>
                <th className="p-4 text-center">Won Deals</th>
                <th className="p-4 text-center">Conversion Rate</th>
                <th className="p-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((item, index) => {
                const rank = index + 1;
                return (
                  <tr key={item.employee._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-center font-bold text-slate-600">
                      <div className="flex items-center justify-center">
                        {RANK_BADGES[rank] || <span className="text-xs text-slate-455">#{rank}</span>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-850">{item.employee.name}</td>
                    <td className="p-4 text-xs text-slate-450 font-semibold">{item.employee.role}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                        {item.activityCount} logs
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">{item.wonLeads}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700">
                        <Target className="w-3.5 h-3.5 text-purple-650" />
                        <span>{item.conversionRate}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-extrabold text-emerald-600">
                      ${item.revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TeamPerformance;
