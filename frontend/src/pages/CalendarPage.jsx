import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { leadService } from '../services/leadService';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X, AlertCircle } from 'lucide-react';

function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Scheduler Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [modalForm, setModalForm] = useState({
    leadId: '',
    type: 'Call',
    summary: '',
    followUpDate: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const tasksRes = await api.get('/communications/followups');
      if (tasksRes.success) {
        setTasks(tasksRes.data);
      }
      const leadsRes = await leadService.getAll();
      if (leadsRes.success) {
        setLeads(leadsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleDayDoubleClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    setSelectedDateStr(dateStr);
    setModalForm({
      leadId: leads.length > 0 ? leads[0]._id : '',
      type: 'Call',
      summary: '',
      followUpDate: dateStr
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/communications', modalForm);
      if (res.success) {
        setTasks([...tasks, res.data]);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to schedule reminder');
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysGrid = [];
  // Fill blanks before first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }
  // Fill days
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(i);
  }

  // Get tasks for a specific calendar day
  const getTasksForDay = (day) => {
    if (!day) return [];
    return tasks.filter(task => {
      const taskDate = new Date(task.followUpDate);
      return (
        taskDate.getDate() === day &&
        taskDate.getMonth() === month &&
        taskDate.getFullYear() === year
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Calendar</h1>
          <p className="text-slate-550 text-sm">Review interaction timelines, task dates, and launch scheduler events.</p>
        </div>
        <button
          onClick={() => {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            setSelectedDateStr(`${y}-${m}-${d}`);
            setModalForm({
              leadId: leads.length > 0 ? leads[0]._id : '',
              type: 'Call',
              summary: '',
              followUpDate: `${y}-${m}-${d}`
            });
            setIsModalOpen(true);
          }}
          disabled={leads.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-550 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/15 cursor-pointer text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* Monthly Control Panel */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm glass-panel">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-indigo-650" />
          <h3 className="font-extrabold text-base text-slate-800">
            {monthNames[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer text-slate-600 hover:text-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer text-slate-600 hover:text-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid calendar */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
            <span className="text-slate-500 text-sm font-semibold">Organizing calendar timelines...</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel border rounded-2xl overflow-hidden shadow-sm bg-white">
          {/* Weekday titles */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/50 py-3 text-xs font-bold text-slate-550 uppercase tracking-wider">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-t border-slate-100">
            {daysGrid.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isToday =
                day &&
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={idx}
                  onDoubleClick={() => day && handleDayDoubleClick(day)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between group transition select-none cursor-pointer ${
                    day ? 'bg-white hover:bg-slate-50/30' : 'bg-slate-50/10'
                  } ${isToday ? 'bg-indigo-50/20' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold flex items-center justify-center h-6 w-6 rounded-lg ${
                        isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'
                      }`}
                    >
                      {day || ''}
                    </span>
                    {day && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayDoubleClick(day);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-650 transition cursor-pointer"
                        title="Quick schedule"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Tasks List inside Day */}
                  <div className="flex-1 mt-1.5 flex flex-col gap-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                    {dayTasks.map(t => (
                      <div
                        key={t._id}
                        className={`text-[9px] font-bold p-1 rounded border truncate text-left ${
                          t.followUpCompleted
                            ? 'bg-slate-50 text-slate-400 border-slate-100 line-through'
                            : t.leadId?.priority === 'High'
                            ? 'bg-red-50 text-red-700 border-red-150'
                            : t.leadId?.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                        }`}
                        title={`${t.leadId?.companyName}: ${t.summary}`}
                      >
                        {t.leadId?.companyName.split(' ')[0]}: {t.summary}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Scheduler Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-750 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-850 mb-5 select-none flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-650" />
              <span>Schedule Follow-up Task</span>
            </h3>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Client Lead</label>
                {leads.length === 0 ? (
                  <div className="text-xs text-red-550 italic font-semibold">Please create a lead profile first.</div>
                ) : (
                  <select
                    value={modalForm.leadId}
                    required
                    onChange={(e) => setModalForm({ ...modalForm, leadId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                  >
                    {leads.map(lead => (
                      <option key={lead._id} value={lead._id}>
                        {lead.companyName} ({lead.contactPerson})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Task Type</label>
                <select
                  value={modalForm.type}
                  onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                >
                  <option value="Call">Call Log</option>
                  <option value="Email">Email Outreach</option>
                  <option value="Meeting">Customer Meeting</option>
                  <option value="Note">Internal Task Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Task Date</label>
                <input
                  type="date"
                  required
                  value={modalForm.followUpDate}
                  onChange={(e) => setModalForm({ ...modalForm, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Task Summary</label>
                <textarea
                  required
                  value={modalForm.summary}
                  onChange={(e) => setModalForm({ ...modalForm, summary: e.target.value })}
                  placeholder="Details of what needs to be followed up..."
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-650 text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={leads.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
