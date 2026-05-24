import React, { useState, useEffect } from 'react';
import { leadService } from '../services/leadService';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Edit3, Trash2, X, Briefcase, Mail, Phone, DollarSign, Calendar, 
  SlidersHorizontal, Sparkles, FileSpreadsheet, ArrowLeft, Star, Users, MessageSquare, ClipboardList, Clock, Bell
} from 'lucide-react';

function Leads() {
  const { user } = useAuth();
  
  // Leads list states
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter/Sort states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('none'); 
  const [error, setError] = useState('');

  // Selected Lead Details workspace states
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [leadLogs, setLeadLogs] = useState([]);
  const [loadingLeadLogs, setLoadingLeadLogs] = useState(false);
  const [newLogForm, setNewLogForm] = useState({
    type: 'Call',
    summary: '',
    followUpDate: ''
  });

  // Modal forms states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    dealAmount: '',
    status: 'New',
    assignedTo: '',
    expectedClosingDate: '',
    priority: 'Medium',
    leadSource: 'Website',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await leadService.getAll();
      if (res.success) {
        setLeads(res.data);
      }
      
      const teamRes = await api.get('/auth/users');
      if (teamRes.success) {
        setTeamMembers(teamRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRow = async (lead) => {
    setSelectedLead(lead);
    setActiveTab('Overview');
    setLoadingLeadLogs(true);
    try {
      const res = await api.get(`/communications/lead/${lead._id}`);
      if (res.success) {
        setLeadLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch communications for selected lead:', err);
    } finally {
      setLoadingLeadLogs(false);
    }
  };

  const handleAddLeadLog = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/communications', {
        leadId: selectedLead._id,
        ...newLogForm
      });
      if (res.success) {
        setLeadLogs([res.data, ...leadLogs]);
        setNewLogForm({ type: 'Call', summary: '', followUpDate: '' });
        
        // Refresh leads list to reflect updated closing details
        const refreshedLeads = await leadService.getAll();
        if (refreshedLeads.success) {
          setLeads(refreshedLeads.data);
          const updatedSelected = refreshedLeads.data.find(l => l._id === selectedLead._id);
          if (updatedSelected) setSelectedLead(updatedSelected);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to log interaction');
    }
  };

  const handleOpenCreate = () => {
    setEditingLead(null);
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      dealAmount: '',
      status: 'New',
      assignedTo: '',
      expectedClosingDate: '',
      priority: 'Medium',
      leadSource: 'Website',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead, e) => {
    if (e) e.stopPropagation();
    setEditingLead(lead);
    setFormData({
      companyName: lead.companyName,
      contactPerson: lead.contactPerson,
      email: lead.email,
      phone: lead.phone || '',
      dealAmount: lead.dealAmount || '',
      status: lead.status,
      assignedTo: lead.assignedTo?._id || '',
      expectedClosingDate: lead.expectedClosingDate ? lead.expectedClosingDate.split('T')[0] : '',
      priority: lead.priority || 'Medium',
      leadSource: lead.leadSource || 'Website',
      notes: lead.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dealAmount: Number(formData.dealAmount) || 0,
        assignedTo: formData.assignedTo || null,
        expectedClosingDate: formData.expectedClosingDate || null
      };

      if (editingLead) {
        const res = await leadService.update(editingLead._id, payload);
        if (res.success) {
          setLeads(leads.map(l => l._id === editingLead._id ? res.data : l));
          if (selectedLead && selectedLead._id === editingLead._id) {
            setSelectedLead(res.data);
          }
        }
      } else {
        const res = await leadService.create(payload);
        if (res.success) {
          setLeads([res.data, ...leads]);
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this lead record permanently?')) return;
    try {
      const res = await leadService.delete(id);
      if (res.success) {
        setLeads(leads.filter(l => l._id !== id));
        if (selectedLead && selectedLead._id === id) {
          setSelectedLead(null);
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete lead.');
    }
  };

  const handleAiRescore = async (leadId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/ai/score/${leadId}`);
      if (res.success) {
        setLeads(leads.map(l => l._id === leadId ? { ...l, aiScore: res.data.aiScore } : l));
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead({ ...selectedLead, aiScore: res.data.aiScore });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to calculate AI lead score.');
    }
  };

  const handleExportCsv = () => {
    if (filteredLeads.length === 0) return alert('No lead records to export.');
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Valuation ($)', 'Stage', 'Priority', 'Source', 'Close Date', 'AI Score'];
    const rows = filteredLeads.map(l => [
      `"${l.companyName}"`,
      `"${l.contactPerson}"`,
      l.email,
      l.phone || '',
      l.dealAmount,
      l.status,
      l.priority || 'Medium',
      l.leadSource || 'Website',
      l.expectedClosingDate ? new Date(l.expectedClosingDate).toLocaleDateString() : 'N/A',
      l.aiScore || 50
    ]);

    const csvStr = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BDA_Leads_Database_${Date.now()}.csv`;
    link.click();
  };

  // Filter & Sort Logic
  let filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesOwner = assignedFilter === 'All' || lead.assignedTo?._id === assignedFilter;
    
    return matchesSearch && matchesStatus && matchesOwner;
  });

  if (sortOrder === 'desc') {
    filteredLeads.sort((a, b) => b.dealAmount - a.dealAmount);
  } else if (sortOrder === 'asc') {
    filteredLeads.sort((a, b) => a.dealAmount - b.dealAmount);
  }

  // ======================================================
  // LEAD DETAILS WORKSPACE (Slide-over)
  // ======================================================
  if (selectedLead) {
    // Next upcoming follow-up for this lead
    const upcomingTask = leadLogs.find(log => log.followUpDate && !log.followUpCompleted);

    return (
      <div className="space-y-6 font-sans animate-slide-in text-left">
        {/* Detail Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <button
              onClick={() => setSelectedLead(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-650 transition cursor-pointer mb-2 uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Leads</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
                {selectedLead.companyName}
              </h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                selectedLead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                selectedLead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                selectedLead.status === 'Follow-up' ? 'bg-indigo-550/10 text-indigo-600 border-indigo-100' :
                selectedLead.status === 'Negotiation' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                selectedLead.status === 'Won' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                'bg-red-50 text-red-650 border-red-100'
              }`}>
                {selectedLead.status}
              </span>
              <div className="flex items-center gap-0.5 text-yellow-500 select-none pl-1">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current opacity-70" />
                <span className="text-xs font-black text-slate-500 pl-1.5">4.8 Rating</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleOpenEdit(selectedLead, e)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition cursor-pointer text-xs shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Modify Details</span>
            </button>
            {(user.role === 'Admin' || user.role === 'Manager') && (
              <button
                onClick={(e) => handleDelete(selectedLead._id, e)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold border border-red-100 rounded-xl transition cursor-pointer text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Lead</span>
              </button>
            )}
          </div>
        </div>

        {/* Detail Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left panel: Info and Tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs control header */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              {['Overview', 'Communication logs', 'Task logger'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'Overview' && (
              <div className="glass-panel p-5 rounded-2xl bg-white space-y-6">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Lead Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-slate-650">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-455 uppercase tracking-wider">Representative Owner</span>
                      <span className="text-slate-800 font-bold">{selectedLead.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-455 uppercase tracking-wider">Contact Person</span>
                      <span className="text-slate-800 font-bold">{selectedLead.contactPerson}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-455 uppercase tracking-wider">Contact Email</span>
                      <span className="text-indigo-650 font-bold underline">{selectedLead.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-455 uppercase tracking-wider">Contact Phone</span>
                      <span className="text-slate-800 font-bold">{selectedLead.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-455 uppercase tracking-wider">Deal Valuation</span>
                      <span className="text-slate-800 font-bold">${selectedLead.dealAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-455 uppercase tracking-wider">Lead Source</span>
                      <span className="text-slate-800 font-bold uppercase">{selectedLead.leadSource || 'Website'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2 col-span-1 md:col-span-2">
                      <span className="text-slate-455 uppercase tracking-wider">Expected Close Date</span>
                      <span className="text-slate-800 font-bold">
                        {selectedLead.expectedClosingDate ? new Date(selectedLead.expectedClosingDate).toLocaleDateString(undefined, {month:'long', day:'numeric', year:'numeric'}) : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-4 text-left">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Description Notes</h3>
                  <p className="text-xs text-slate-650 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-medium">
                    {selectedLead.notes || 'No description notes recorded for this manufacturing lead.'}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Communication logs */}
            {activeTab === 'Overview' && (
              <div className="glass-panel p-5 rounded-2xl bg-white space-y-6">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Client Timeline History</h3>
                {loadingLeadLogs ? (
                  <div className="py-8 flex justify-center">
                    <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
                  </div>
                ) : leadLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 italic">No communication logs recorded.</div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 pl-4 space-y-4 ml-1">
                    {leadLogs.map(log => (
                      <div key={log._id} className="relative group text-left">
                        <span className="absolute -left-[24px] top-0.5 p-1 rounded-full border bg-white border-slate-200 text-xs">
                          {log.type === 'Call' ? '📞' : log.type === 'Email' ? '✉️' : '👥'}
                        </span>
                        <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span className="uppercase">{log.type} Log</span>
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-semibold">{log.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Action Log scheduler form */}
            {activeTab === 'Communication logs' && (
              <div className="glass-panel p-5 rounded-2xl bg-white">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-650" />
                  <span>Log Client Outreach Interaction</span>
                </h3>

                <form onSubmit={handleAddLeadLog} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Outreach Type</label>
                      <select
                        value={newLogForm.type}
                        onChange={(e) => setNewLogForm({ ...newLogForm, type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <option value="Call">Call Log</option>
                        <option value="Email">Email Outbound</option>
                        <option value="Meeting">Customer Meeting</option>
                        <option value="Note">Internal Summary Note</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Schedule Follow-up Date (Optional)</label>
                      <input
                        type="date"
                        value={newLogForm.followUpDate}
                        onChange={(e) => setNewLogForm({ ...newLogForm, followUpDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interaction Summary Details</label>
                    <textarea
                      required
                      value={newLogForm.summary}
                      onChange={(e) => setNewLogForm({ ...newLogForm, summary: e.target.value })}
                      placeholder="Notes of what was discussed, next step negotiations..."
                      rows="3"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-xs placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-white font-bold rounded-xl transition text-xs shadow-md shadow-indigo-600/10"
                    >
                      Save log spec
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Tasks timeline */}
            {activeTab === 'Task logger' && (
              <div className="glass-panel p-5 rounded-2xl bg-white space-y-4">
                <h3 className="text-sm font-bold text-slate-850 mb-3 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-650" />
                  <span>Tasks Checklist specifically for this lead</span>
                </h3>
                {leadLogs.filter(log => log.followUpDate).length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">No scheduled follow-up tasks linked to this profile.</div>
                ) : (
                  <div className="space-y-2">
                    {leadLogs.filter(log => log.followUpDate).map(t => (
                      <div key={t._id} className="p-3 bg-slate-50/50 border border-slate-150 rounded-xl flex items-center justify-between gap-3 text-left">
                        <div>
                          <p className="text-xs text-slate-700 font-bold">{t.summary}</p>
                          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Due: {new Date(t.followUpDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                          t.followUpCompleted 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                        }`}>
                          {t.followUpCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Alerts & team */}
          <div className="space-y-6">
            {/* Upcoming Follow-up Card */}
            <div className="glass-panel p-5 rounded-2xl bg-white shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500 rounded-full blur-2xl opacity-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-2.5 mb-3 border-b border-slate-100 pb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Follow-up Alert</span>
                  <span className="font-bold text-slate-800 text-xs">Next Scheduled Task</span>
                </div>
              </div>

              {upcomingTask ? (
                <div className="space-y-2 text-left">
                  <p className="text-xs text-slate-700 font-bold leading-normal line-clamp-2">{upcomingTask.summary}</p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3" />
                    {new Date(upcomingTask.followUpDate).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 italic">No pending follow-ups.</div>
              )}
            </div>

            {/* Team Members collaborative card */}
            <div className="glass-panel p-5 rounded-2xl bg-white shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-indigo-650" />
                  <span>Team Members</span>
                </h4>
                <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-650 transition cursor-pointer" title="Add collaborator">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-left">
                {/* Owner */}
                <div className="flex items-center gap-2.5 p-2 bg-slate-50/50 border border-slate-150 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-extrabold text-indigo-650 uppercase">
                    {selectedLead.assignedTo?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{selectedLead.assignedTo?.name || 'Unassigned'}</h5>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Lead Owner</span>
                  </div>
                </div>

                {/* Collaborator mock */}
                <div className="flex items-center gap-2.5 p-2 bg-slate-50/50 border border-slate-150 rounded-xl opacity-75">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-xs font-extrabold text-purple-650 uppercase">
                    S
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Steve R.</h5>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Collaborator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">Lead Database</h1>
          <p className="text-slate-550 text-sm font-semibold">Create, monitor, and assign sales leads for BDA pipelines.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition cursor-pointer text-xs shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-550 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/15 hover:shadow-indigo-650/25 cursor-pointer text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters & Sorting bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm glass-panel text-left">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search by company, contact person or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition text-slate-850 text-xs placeholder-slate-400 font-medium"
          />
        </div>
        
        {/* Filter by Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition text-slate-750 text-xs cursor-pointer font-bold"
          >
            <option value="All">All Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {/* Filter by BDA Representative */}
        <div>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition text-slate-750 text-xs cursor-pointer font-bold"
          >
            <option value="All">All Representatives</option>
            {teamMembers.map(member => (
              <option key={member._id} value={member._id}>{member.name}</option>
            ))}
          </select>
        </div>

        {/* Sorting controls */}
        <div className="md:col-span-4 flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Sort by Value:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition text-slate-700 text-xs font-bold cursor-pointer"
            >
              <option value="none">Default (Date Added)</option>
              <option value="desc">Valuation (High to Low)</option>
              <option value="asc">Valuation (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads grid list */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
            <span className="text-slate-555 text-sm font-semibold">Loading lead profiles...</span>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center bg-white">
          <Briefcase className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No leads found</h3>
          <p className="text-slate-455 text-sm max-w-sm mx-auto mt-1 font-medium">
            Try adjusting your search criteria or create a brand new lead template.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-650">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="p-4">Company</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Priority / Source</th>
                  <th className="p-4">Valuation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">AI Score</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead._id}
                    onClick={() => handleSelectRow(lead)}
                    className="hover:bg-slate-50/50 transition cursor-pointer"
                  >
                    <td className="p-4 font-bold text-slate-800 text-sm text-left">
                      <div>{lead.companyName}</div>
                      <div className="text-[10px] text-slate-455 font-normal mt-0.5 max-w-xs truncate">{lead.notes || 'No description notes.'}</div>
                    </td>
                    <td className="p-4 text-left">
                      <div className="font-semibold text-slate-750">{lead.contactPerson}</div>
                      <div className="text-xs text-slate-455 font-semibold">{lead.email}</div>
                    </td>
                    <td className="p-4 text-left space-y-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        lead.priority === 'High' ? 'bg-red-50 text-red-650 border-red-100' :
                        lead.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-650 border-blue-100'
                      }`}>
                        {lead.priority || 'Medium'}
                      </span>
                      <span className="text-[9px] text-slate-455 font-bold block ml-0.5 uppercase">Source: {lead.leadSource || 'Website'}</span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-850 text-left">
                      ${lead.dealAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-left">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        lead.status === 'New' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        lead.status === 'Follow-up' ? 'bg-indigo-50/80 text-indigo-650 border-indigo-100' :
                        lead.status === 'Negotiation' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        lead.status === 'Won' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-red-50 text-red-650 border-red-100'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-650 uppercase">
                            {lead.assignedTo.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-700 text-xs">{lead.assignedTo.name}</div>
                            <div className="text-[9px] text-slate-455 font-semibold uppercase">{lead.assignedTo.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic font-semibold">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="text-xs font-black px-2 py-0.5 rounded border inline-block select-none"
                          style={{
                            backgroundColor: lead.aiScore >= 75 ? 'rgba(16, 185, 129, 0.08)' : lead.aiScore >= 60 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                            color: lead.aiScore >= 75 ? '#10b981' : lead.aiScore >= 60 ? '#d97706' : '#2563eb',
                            borderColor: lead.aiScore >= 75 ? 'rgba(16, 185, 129, 0.15)' : lead.aiScore >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)'
                          }}
                        >
                          {lead.aiScore}%
                        </span>
                        <button
                          onClick={(e) => handleAiRescore(lead._id, e)}
                          className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-550/40 rounded-lg text-slate-505 hover:text-purple-655 transition cursor-pointer shadow-sm"
                          title="Recalculate AI Win probability"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleOpenEdit(lead, e)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {(user.role === 'Admin' || user.role === 'Manager') && (
                          <button
                            onClick={(e) => handleDelete(lead._id, e)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-550 hover:text-red-650 transition cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-slate-850 mb-6 select-none text-left">
              {editingLead ? 'Modify BDA Lead' : 'Initialize BDA Lead'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Briefcase className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Acme Industrial Corp"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@acme.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Phone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Phone className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Deal Valuation ($)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <DollarSign className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="number"
                      name="dealAmount"
                      value={formData.dealAmount}
                      onChange={handleChange}
                      placeholder="25000"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Priority Level</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Source</label>
                  <select
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Exhibition">Exhibition</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expected Closing</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Calendar className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="date"
                      name="expectedClosingDate"
                      value={formData.expectedClosingDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-850 text-sm cursor-pointer font-medium"
                    />
                  </div>
                </div>

                {/* Team member selection for lead routing - Admin/Manager only */}
                {(user.role === 'Admin' || user.role === 'Manager') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assign Representative</label>
                    <select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                    >
                      <option value="">-- Leave Unassigned --</option>
                      {teamMembers.map(member => (
                        <option key={member._id} value={member._id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Lead Notes & Context Details</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter project specifications, manufacturing materials details, or client pain points..."
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium"
                  ></textarea>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-650 text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  {editingLead ? 'Save Updates' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;
