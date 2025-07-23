import React, { useState, useEffect } from 'react';
import DocumentTypeChart from '../components/charts/DocumentTypeChart';

// --- ✨ Icon Imports (Aligned with HomePage) ---
import {
  LayoutDashboard, Search, BarChart2, Menu, X, ChevronsLeft, ChevronsRight,
  Files, CheckCircle, AlertTriangle, Clock, PieChart, Activity, Sun, Moon
} from 'lucide-react';

// --- ✨ REFINED: StatCard with Dark Mode & Hover effects ---
const StatCard = ({ title, value, icon: Icon, color, note }) => (
  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50 transform transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.bg} dark:${color.darkBg}`}>
        <Icon className={`${color.text} dark:${color.darkText}`} size={24} />
      </div>
    </div>
    {note && <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{note}</p>}
  </div>
);

// --- ✨ Main Dashboard Component ---
const DashboardPage = ({
  files = [],
  suspiciousGroups = [],
  currentDate,
  currentTime,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed
}) => {
  // --- ✨ ADDED: Dark Mode State & Logic (from HomePage) ---
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode') || 'false'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const safeFiles = files || [];
  const safeSuspiciousGroups = suspiciousGroups || [];
  const today = new Date().toISOString().slice(0, 10);

  const todayFilesCount = safeFiles.filter(f => (f.uploadedAt || f.uploaded_at || '').includes(today)).length;
  const processedFilesCount = safeFiles.filter(f => ['complete', 'processed'].includes(f.similarity_status?.toLowerCase())).length;
  const successRate = safeFiles.length > 0 ? Math.round((processedFilesCount / safeFiles.length) * 100) : 0;

  // --- ✨ REFINED: Timeline Chart with Dark Mode ---
  const TimelineChart = () => {
    const timeData = [
      { time: '09:00', count: safeFiles.filter(f => (f.uploadedAt || f.uploaded_at || '').includes('T09:')).length },
      { time: '11:00', count: safeFiles.filter(f => (f.uploadedAt || f.uploaded_at || '').includes('T11:')).length },
      { time: '13:00', count: safeFiles.filter(f => (f.uploadedAt || f.uploaded_at || '').includes('T13:')).length },
      { time: '15:00', count: safeFiles.filter(f => (f.uploadedAt || f.uploaded_at || '').includes('T15:')).length },
      { time: '17:00', count: safeFiles.filter(f => (f.uploadedAt || f.uploaded_at || '').includes('T17:')).length },
    ];
    const maxCount = Math.max(...timeData.map(d => d.count), 1);

    return (
      <div className="w-full h-full flex flex-col pt-4">
        <div className="flex-grow flex items-end justify-around gap-4 px-2 border-b border-l border-slate-200 dark:border-slate-700">
          {timeData.map(item => (
            <div key={item.time} className="flex flex-col items-center flex-1 group">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -mb-4">{item.count}</div>
              <div
                className="bg-indigo-500 w-full transition-all duration-300 hover:bg-indigo-600 rounded-t-lg"
                style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: '4px' }}
                title={`${item.time}: ${item.count} files`}
              ></div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-100/50 dark:bg-slate-950">
      {/* --- ✨ REFINED: Sidebar with Dark Mode (Matches HomePage) --- */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col border-r border-slate-200 dark:border-slate-800 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className={`flex items-center justify-between p-4 h-20 border-b border-slate-200 dark:border-slate-800 ${sidebarCollapsed && 'lg:justify-center'}`}>
          {!sidebarCollapsed && <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            {sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: 'Home', icon: LayoutDashboard, page: 'home' },
            { name: 'Detection', icon: Search, page: 'groups' },
            { name: 'Analytics', icon: BarChart2, page: 'dashboard' },
          ].map(item => (
            <button key={item.name} onClick={() => { setCurrentPage(item.page); setSidebarOpen(false); }} title={sidebarCollapsed ? item.name : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.page ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'} ${sidebarCollapsed && 'justify-center'}`} >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* --- ✨ REFINED: Main Content with Dark Mode (Matches HomePage) --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-8 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-800 dark:text-slate-200"><Menu size={24} /></button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <div className="text-right">
              <div className="font-semibold text-slate-700 dark:text-slate-300">{currentDate}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{currentTime}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Documents" value={safeFiles.length} icon={Files} color={{ bg: 'bg-blue-50', text: 'text-blue-600', darkBg: 'dark:bg-blue-500/10', darkText: 'dark:text-blue-400' }} note="All documents in the system" />
            <StatCard title="Success Rate" value={`${successRate}%`} icon={CheckCircle} color={{ bg: 'bg-green-50', text: 'text-green-600', darkBg: 'dark:bg-green-500/10', darkText: 'dark:text-green-400' }} note={`${processedFilesCount} files processed`} />
            <StatCard title="Anomaly Groups" value={safeSuspiciousGroups.length} icon={AlertTriangle} color={{ bg: 'bg-red-50', text: 'text-red-600', darkBg: 'dark:bg-red-500/10', darkText: 'dark:text-red-400' }} note="Groups needing review" />
            <StatCard title="Today's Uploads" value={todayFilesCount} icon={Clock} color={{ bg: 'bg-amber-50', text: 'text-amber-600', darkBg: 'dark:bg-amber-500/10', darkText: 'dark:text-amber-400' }} note="Files uploaded since midnight" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <PieChart size={20} className="text-indigo-500 dark:text-indigo-400" />
                Document Distribution
              </h3>
              <div className="h-80 flex items-center justify-center">
                <DocumentTypeChart files={safeFiles} />
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Activity size={20} className="text-indigo-500 dark:text-indigo-400" />
                Upload Activity
              </h3>
              <div className="h-80">
                <TimelineChart />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {safeFiles.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent files uploaded.</p>
              ) : (
                safeFiles.slice(0, 5).map((file, idx) => (
                  <div key={file.id || idx} className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{file.name || file.fileName || 'Unnamed File'}</p>
                      <p className="text-sm text-slate-400">{file.type || 'Unknown Type'}</p>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{new Date(file.uploadedAt || file.uploaded_at || Date.now()).toLocaleString('th-TH', { timeStyle: 'short', dateStyle: 'short' })}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;