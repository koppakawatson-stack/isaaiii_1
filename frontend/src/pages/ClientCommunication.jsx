import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { leadService } from '../services/leadService';
import { Phone, Mail, Users, FileText, Plus, Calendar, AlertCircle, Bell, ArrowRight, MessageSquare, Sparkles, X, Copy, Check } from 'lucide-react';

const TYPE_ICONS = {
  Call: <Phone className="w-4.5 h-4.5 text-indigo-600" />,
  Email: <Mail className="w-4.5 h-4.5 text-amber-600" />,
  Meeting: <Users className="w-4.5 h-4.5 text-purple-600" />,
  Note: <FileText className="w-4.5 h-4.5 text-slate-600" />
};

const TYPE_BG = {
  Call: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  Email: 'bg-amber-50 border-amber-100 text-amber-600',
  Meeting: 'bg-purple-50 border-purple-100 text-purple-600',
  Note: 'bg-slate-50 border-slate-200 text-slate-600'
};

function ClientCommunication() {
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [logs, setLogs] = useState([]);
  const [followups, setFollowups] = useState([]);
  
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingFollowups, setLoadingFollowups] = useState(true);
  
  const [formData, setFormData] = useState({
    type: 'Call',
    summary: '',
    followUpDate: ''
  });
  const [error, setError] = useState('');

  // AI Email Generator Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiForm, setAiForm] = useState({
    stage: 'Introductory',
    keyHighlight: ''
  });
  const [aiResult, setAiResult] = useState(null);

  const loadInitialData = async () => {
    try {
      // Load Leads
      const leadsRes = await leadService.getAll();
      if (leadsRes.success) {
        setLeads(leadsRes.data);
        if (leadsRes.data.length > 0) {
          setSelectedLeadId(leadsRes.data[0]._id);
        }
      }

      // Load Followups
      const followRes = await api.get('/communications/followups');
      if (followRes.success) {
        setFollowups(followRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load initial data.');
    } finally {
      setLoadingLeads(false);
      setLoadingFollowups(false);
    }
  };

  const loadLogsForLead = async (leadId) => {
    if (!leadId) return;
    setLoadingLogs(true);
    try {
      const res = await api.get(`/communications/lead/${leadId}`);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      loadLogsForLead(selectedLeadId);
    }
  }, [selectedLeadId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) return;
    try {
      const payload = {
        leadId: selectedLeadId,
        type: formData.type,
        summary: formData.summary,
        followUpDate: formData.followUpDate || null
      };

      const res = await api.post('/communications', payload);
      if (res.success) {
        setLogs([res.data, ...logs]);
        setFormData({
          type: 'Call',
          summary: '',
          followUpDate: ''
        });
        
        // Reload followups to update lists
        const followRes = await api.get('/communications/followups');
        if (followRes.success) {
          setFollowups(followRes.data);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit log.');
    }
  };

  // AI Email Generator trigger
  const handleGenerateAiEmail = async (e) => {
    e.preventDefault();
    const activeLead = leads.find(l => l._id === selectedLeadId);
    if (!activeLead) return;

    setAiLoading(true);
    setAiResult(null);
    setCopied(false);

    try {
      const res = await api.post('/ai/email', {
        companyName: activeLead.companyName,
        contactPerson: activeLead.contactPerson,
        stage: aiForm.stage,
        keyHighlight: aiForm.keyHighlight
      });
      if (res.success) {
        setAiResult(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate AI email template.');
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!aiResult) return;
    const text = `Subject: ${aiResult.subject}\n\n${aiResult.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertIntoSummary = () => {
    if (!aiResult) return;
    setFormData({
      ...formData,
      type: 'Email',
      summary: `[AI Generated Outreach Draft]\nSubject: ${aiResult.subject}\n\n${aiResult.body}`
    });
    setIsAiModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Client Communications</h1>
          <p className="text-slate-550 text-sm">Log calls, notes, and emails. Set future reminders to keep BDA leads warm.</p>
        </div>
        {selectedLeadId && (
          <button
            onClick={() => {
              setAiResult(null);
              setIsAiModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-650/15 cursor-pointer text-sm shrink-0 font-sans"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>AI Email Generator</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Timeline & Input: Col-span 2 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>Select Active Account</span>
            </h3>

            {loadingLeads ? (
              <div className="h-10 w-full bg-slate-50 animate-pulse rounded-xl"></div>
            ) : leads.length === 0 ? (
              <div className="text-sm text-slate-500 italic">Please create a lead under the Leads page first.</div>
            ) : (
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition text-slate-800 cursor-pointer text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10"
              >
                {leads.map(lead => (
                  <option key={lead._id} value={lead._id}>
                    {lead.companyName} — Contact: {lead.contactPerson} ({lead.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Form to log communication */}
          {selectedLeadId && (
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-base font-bold text-slate-850 mb-4">Record New Client Interaction</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interaction Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <option value="Call">Call Log</option>
                      <option value="Email">Email Outbound/Inbound</option>
                      <option value="Meeting">Customer Meeting</option>
                      <option value="Note">Internal Summary Note</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Schedule Follow-up Date (Optional)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        name="followUpDate"
                        value={formData.followUpDate}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer focus:ring-4 focus:ring-indigo-500/10 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interaction Summary & Notes</label>
                    <textarea
                      name="summary"
                      required
                      value={formData.summary}
                      onChange={handleChange}
                      placeholder="Enter a brief summary of what was discussed, next steps, client pain points..."
                      rows="3"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Log Entry</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline list */}
          {selectedLeadId && (
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-base font-bold text-slate-800 mb-6">Interaction Timeline History</h3>

              {loadingLogs ? (
                <div className="py-12 flex justify-center">
                  <span className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500 italic">
                  No interaction logs recorded for this account yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-5 space-y-6 ml-2.5">
                  {logs.map(log => (
                    <div key={log._id} className="relative group">
                      {/* Timeline Icon Badge */}
                      <span className={`absolute -left-[32px] top-0 p-1.5 rounded-full border bg-white ${TYPE_BG[log.type]}`}>
                        {TYPE_ICONS[log.type]}
                      </span>

                      {/* Log Card */}
                      <div className="space-y-1 bg-slate-50/50 group-hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200 transition duration-150">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{log.type}</span>
                          <span className="text-[10px] text-slate-450">
                            {new Date(log.createdAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-755 mt-1 whitespace-pre-wrap leading-relaxed font-medium">{log.summary}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-slate-500 font-semibold border-t border-slate-200/60 mt-2">
                          <span>Logged by: <span className="text-slate-700 font-bold">{log.performedBy?.name}</span></span>
                          
                          {log.followUpDate && (
                            <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              <Bell className="w-3 h-3" />
                              Follow-up: {new Date(log.followUpDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reminders Sidebar: Col-span 1 */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">Upcoming Follow-ups</h3>
            </div>

            {loadingFollowups ? (
              <div className="space-y-3">
                <div className="h-16 w-full bg-slate-50 animate-pulse rounded-xl"></div>
                <div className="h-16 w-full bg-slate-50 animate-pulse rounded-xl"></div>
              </div>
            ) : followups.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                All client follow-ups are currently completed!
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {followups.map(log => {
                  const daysLeft = Math.ceil((new Date(log.followUpDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysLeft < 0;

                  return (
                    <div 
                      key={log._id} 
                      onClick={() => setSelectedLeadId(log.leadId?._id)}
                      className="p-3 bg-slate-50/50 border border-slate-200 hover:border-indigo-500/40 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-2 relative group"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-650 transition truncate max-w-[130px]">
                          {log.leadId?.companyName || 'Unknown Co.'}
                        </span>
                        
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                          isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 
                          daysLeft === 0 ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-semibold">
                        {log.summary}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold border-t border-slate-200/60 pt-2">
                        <span className="flex items-center gap-1 font-bold">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(log.followUpDate).toLocaleDateString()}
                        </span>
                        <span className="text-slate-600 flex items-center gap-0.5 font-bold">
                          Open <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Outreach Email Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAiModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-850">AI BDA Outreach Tool</h3>
            </div>

            <form onSubmit={handleGenerateAiEmail} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Outreach Stage</label>
                  <select
                    value={aiForm.stage}
                    onChange={(e) => setAiForm({ ...aiForm, stage: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-850 text-xs cursor-pointer font-semibold"
                  >
                    <option value="Introductory">Introductory Pitch</option>
                    <option value="FollowUp">Product Catalog Follow-up</option>
                    <option value="Negotiation">Proposal terms / Negotiation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Highlight / Topic</label>
                  <input
                    type="text"
                    value={aiForm.keyHighlight}
                    onChange={(e) => setAiForm({ ...aiForm, keyHighlight: e.target.value })}
                    placeholder="e.g. reduce machine downtime by 18%"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-850 text-xs placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {aiLoading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Generate AI Outreach Template</span>
                  </>
                )}
              </button>
            </form>

            {/* Result Area */}
            {aiResult && (
              <div className="mt-6 space-y-3 animate-slide-up">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">AI Generated Outreach Template</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-650 hover:text-slate-800 transition flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Template'}</span>
                    </button>
                    <button
                      onClick={insertIntoSummary}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-indigo-650 hover:text-indigo-850 transition flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Insert into Form</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 max-h-60 overflow-y-auto font-mono text-xs text-slate-700">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                    Subject: {aiResult.subject}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{aiResult.body}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientCommunication;
