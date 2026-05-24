import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import ClientCommunication from './pages/ClientCommunication';
import TeamPerformance from './pages/TeamPerformance';
import Tasks from './pages/Tasks';
import CalendarPage from './pages/CalendarPage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function DashboardShell() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'leads':
        return <Leads />;
      case 'pipeline':
        return <Pipeline />;
      case 'communications':
        return <ClientCommunication />;
      case 'performance':
        return <TeamPerformance />;
      case 'tasks':
        return <Tasks />;
      case 'calendar':
        return <CalendarPage />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex bg-[#f8fafc] text-slate-850 min-h-screen font-sans">
      {/* Sidebar Nav */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        
        <main className="flex-grow p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></span>
          <span className="text-slate-400 text-sm font-medium">Verifying active session...</span>
        </div>
      </div>
    );
  }

  return user ? <DashboardShell /> : <Login />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
