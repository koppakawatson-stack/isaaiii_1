import React, { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Calendar, TrendingUp, ArrowRight, User } from 'lucide-react';

const STAGES = ['New', 'Contacted', 'Follow-up', 'Negotiation', 'Won', 'Lost'];

const STAGE_COLORS = {
  New: 'border-t-blue-500 bg-blue-50/20',
  Contacted: 'border-t-amber-500 bg-amber-50/20',
  'Follow-up': 'border-t-indigo-500 bg-indigo-50/20',
  Negotiation: 'border-t-purple-500 bg-purple-50/20',
  Won: 'border-t-emerald-500 bg-emerald-50/20',
  Lost: 'border-t-red-500 bg-red-50/20',
};

const DOT_COLORS = {
  New: 'bg-blue-500',
  Contacted: 'bg-amber-500',
  'Follow-up': 'bg-indigo-550',
  Negotiation: 'bg-purple-500',
  Won: 'bg-emerald-500',
  Lost: 'bg-red-500',
};

function Pipeline() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState(null);

  const fetchLeads = async () => {
    try {
      const res = await leadService.getAll();
      if (res.success) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leads for pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id) return;

    const leadToMove = leads.find(l => l._id === id);
    if (!leadToMove) return;
    
    if (leadToMove.status === targetStatus) return;

    // Optimistic UI Update
    const originalLeads = [...leads];
    setLeads(leads.map(l => l._id === id ? { ...l, status: targetStatus } : l));

    try {
      const res = await leadService.update(id, { status: targetStatus });
      if (!res.success) {
        setLeads(originalLeads);
      }
    } catch (err) {
      console.error('Failed to update stage on server:', err);
      setLeads(originalLeads);
      alert('Failed to update stage. Please check connection.');
    } finally {
      setDraggingId(null);
    }
  };

  // Aggregators for pipeline statistics
  const getStageStats = (stage) => {
    const stageLeads = leads.filter(l => l.status === stage);
    const count = stageLeads.length;
    const totalAmount = stageLeads.reduce((sum, l) => sum + (l.dealAmount || 0), 0);
    return { count, totalAmount };
  };

  const totalValue = leads.reduce((sum, l) => sum + (l.status !== 'Lost' ? (l.dealAmount || 0) : 0), 0);
  const activeValue = leads.reduce((sum, l) => sum + (['New', 'Contacted', 'Follow-up', 'Negotiation'].includes(l.status) ? (l.dealAmount || 0) : 0), 0);
  const wonValue = leads.reduce((sum, l) => sum + (l.status === 'Won' ? (l.dealAmount || 0) : 0), 0);

  return (
    <div className="space-y-6 font-sans">
      <div className="text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Sales Pipeline</h1>
        <p className="text-slate-550 text-sm font-semibold">Visualize BDA deal progress. Drag and drop cards to progress lead lifecycle stages.</p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between shadow-sm bg-white">
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Pipeline Value</span>
            <span className="text-2xl font-extrabold text-slate-850 mt-1 block">${activeValue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between shadow-sm bg-white">
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Closed Won Revenue</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">${wonValue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between shadow-sm bg-white">
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Managed Value</span>
            <span className="text-2xl font-extrabold text-slate-700 mt-1 block">${totalValue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
            <span className="text-slate-500 text-sm font-semibold">Organizing Kanban boards...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4 select-none">
          {STAGES.map(stage => {
            const { count, totalAmount } = getStageStats(stage);
            const stageLeads = leads.filter(l => l.status === stage);

            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className={`glass-panel border-t-4 rounded-2xl p-3.5 min-w-[200px] flex flex-col gap-3 min-h-[550px] transition-all duration-200 border-slate-200 shadow-sm ${STAGE_COLORS[stage]}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[stage]}`}></span>
                    <h3 className="font-bold text-xs text-slate-800">{stage}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-extrabold">
                    {count}
                  </span>
                </div>

                {/* Sub-total */}
                <div className="text-[9px] text-slate-455 flex justify-between font-bold px-1 uppercase tracking-wide">
                  <span>Sub-total</span>
                  <span className="text-slate-700 font-extrabold">${totalAmount.toLocaleString()}</span>
                </div>

                {/* Cards List */}
                <div className="flex flex-col gap-2.5 overflow-y-auto flex-grow max-h-[500px] scrollbar-thin">
                  {stageLeads.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl py-8 text-center text-[10px] text-slate-400 font-semibold italic">
                      Drag leads here
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        className={`p-3 bg-white border border-slate-200/80 rounded-xl cursor-grab active:cursor-grabbing hover:border-indigo-500/40 transition duration-200 shadow-sm relative overflow-hidden group ${
                          draggingId === lead._id ? 'opacity-40 border-indigo-500' : ''
                        }`}
                      >
                        {/* AI Score Accent */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1" 
                          style={{
                            backgroundColor: lead.aiScore >= 75 ? '#10b981' : lead.aiScore >= 60 ? '#f59e0b' : '#3b82f6'
                          }}
                        ></div>

                        <div className="pl-1.5 space-y-2">
                          {/* Company Name */}
                          <div className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-650 transition text-left">
                            {lead.companyName}
                          </div>

                          {/* Contact Person */}
                          <div className="text-[10px] text-slate-500 font-semibold text-left">
                            {lead.contactPerson}
                          </div>

                          {/* Deal Amount & AI score */}
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[11px] font-extrabold text-indigo-650">
                              ${lead.dealAmount.toLocaleString()}
                            </span>
                            
                            <span 
                              className="text-[9px] font-bold px-1 py-0.2 rounded border"
                              style={{
                                backgroundColor: lead.aiScore >= 75 ? 'rgba(16, 185, 129, 0.08)' : lead.aiScore >= 60 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                                color: lead.aiScore >= 75 ? '#10b981' : lead.aiScore >= 60 ? '#d97706' : '#2563eb',
                                borderColor: lead.aiScore >= 75 ? 'rgba(16, 185, 129, 0.15)' : lead.aiScore >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)'
                              }}
                            >
                              {lead.aiScore}%
                            </span>
                          </div>

                          {/* Date and Owner */}
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 text-[8px] text-slate-455">
                            <span className="flex items-center gap-1 font-bold">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {lead.expectedClosingDate ? new Date(lead.expectedClosingDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'No date'}
                            </span>

                            {lead.assignedTo ? (
                              <span className="flex items-center gap-1 font-bold text-slate-600 max-w-[80px] truncate" title={lead.assignedTo.name}>
                                {lead.assignedTo.name.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="italic text-slate-400 font-semibold">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Pipeline;
