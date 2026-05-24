import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Square, Calendar, User, ShieldAlert, CheckCircle2, MessageSquare, AlertCircle, Clock } from 'lucide-react';

function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, completed, all
  const [priorityFilter, setPriorityFilter] = useState('All'); // All, High, Medium, Low
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch followups from communication controller
      const res = await api.get('/communications/followups');
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleComplete = async (id) => {
    try {
      const res = await api.put(`/communications/followup/${id}/toggle`);
      if (res.success) {
        setTasks(tasks.map(t => t._id === id ? { 
          ...t, 
          followUpCompleted: res.data.followUpCompleted,
          followUpCompletedAt: res.data.followUpCompletedAt
        } : t));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update task status');
    }
  };

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = 
      filter === 'all' || 
      (filter === 'pending' && !task.followUpCompleted) || 
      (filter === 'completed' && task.followUpCompleted);

    const matchesPriority = 
      priorityFilter === 'All' || 
      task.leadId?.priority === priorityFilter;

    return matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Tasks & Follow-ups</h1>
          <p className="text-slate-550 text-sm">Organize daily client schedules, log interaction completions, and monitor priority tasks.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm glass-panel">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status:</span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'pending' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'completed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition text-slate-700 text-xs font-bold cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
            <span className="text-slate-500 text-sm font-semibold">Compiling workflow tasks...</span>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No tasks found</h3>
          <p className="text-slate-455 text-sm max-w-sm mx-auto mt-1 font-medium">
            Great job! You have no pending follow-up schedules in this selection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const isOverdue = !task.followUpCompleted && new Date(task.followUpDate) < new Date();
            
            return (
              <div
                key={task._id}
                className={`glass-panel p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-150 ${
                  task.followUpCompleted ? 'opacity-70 bg-slate-50/50' : 'hover:border-indigo-500/30'
                }`}
              >
                {/* Left Side: Check and Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task._id)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-650 transition cursor-pointer shrink-0 mt-0.5"
                    title={task.followUpCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {task.followUpCompleted ? (
                      <CheckSquare className="w-5.5 h-5.5 text-indigo-600" />
                    ) : (
                      <Square className="w-5.5 h-5.5" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-grow min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        task.leadId?.priority === 'High' ? 'bg-red-50 text-red-650 border-red-100' :
                        task.leadId?.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-650 border-blue-100'
                      }`}>
                        {task.leadId?.priority || 'Medium'} Priority
                      </span>
                      <span className="font-bold text-sm text-slate-800 truncate">
                        {task.leadId?.companyName || 'Unknown Company'}
                      </span>
                    </div>

                    <p className={`text-xs text-slate-600 leading-relaxed font-semibold ${task.followUpCompleted ? 'line-through' : ''}`}>
                      {task.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-550 font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due: {new Date(task.followUpDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Owner: {task.performedBy?.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Status badging */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  {!task.followUpCompleted && isOverdue && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                  {task.followUpCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                      <AlertCircle className="w-3 h-3" />
                      Pending
                    </span>
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

export default Tasks;
