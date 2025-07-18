import React from 'react';

// --- Icon Imports ---
import {
  LayoutDashboard, Search, BarChart2, Menu, X, ChevronsLeft, ChevronsRight,
  ShieldAlert, AlertTriangle, ShieldQuestion, FileText, ListChecks, CheckCircle,
  MessageSquarePlus, UploadCloud
} from 'lucide-react';


const GroupsPage = ({
  files = [], suspiciousGroups = [], setSelectedSuspiciousGroup,
  currentDate, currentTime, currentPage, setCurrentPage,
  sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed,
  setShowUploadModal, setShowChatModal
}) => {
  const safeSuspiciousGroups = suspiciousGroups || [];
  const safeFiles = files || [];

  const getSeverityInfo = (level) => {
    switch (level) {
      case 'high':
        return { Icon: ShieldAlert, color: 'text-red-500', text: 'High' };
      case 'medium':
        return { Icon: AlertTriangle, color: 'text-amber-500', text: 'Medium' };
      default:
        return { Icon: ShieldQuestion, color: 'text-yellow-500', text: 'Low' };
    }
  };

  return (
    <div className="flex w-full">
      {/* --- Standardized Sidebar --- */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col border-r border-slate-200 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className={`flex items-center justify-between p-4 h-20 border-b border-slate-200 ${sidebarCollapsed && 'lg:justify-center'}`}>
          {!sidebarCollapsed && <span className="text-xl font-bold text-indigo-600">Dashboard</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-2 hover:bg-slate-100 rounded-lg">
            {sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: 'Home', icon: LayoutDashboard, page: 'home' },
            { name: 'Anomaly Detection', icon: Search, page: 'groups' },
            { name: 'Dashboard', icon: BarChart2, page: 'dashboard' },
          ].map(item => (
            <button
              key={item.name}
              onClick={() => { setCurrentPage(item.page); setSidebarOpen(false); }}
              title={sidebarCollapsed ? item.name : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''
                } ${currentPage === item.page
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* --- Standardized Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-8 h-20 bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2"><Menu size={24} /></button>
            <h1 className="text-2xl font-bold text-slate-800">Anomaly Detection</h1>
          </div>
          <div className="text-right">
            <div className="font-semibold text-slate-700">{currentDate}</div>
            <div className="text-sm text-slate-500">{currentTime} น.</div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8 bg-slate-50/50">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Suspicious Groups</h2>
            <p className="mt-1 text-slate-500">Groups of documents identified by the system as having potential anomalies.</p>
          </div>

          {safeSuspiciousGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200/80">
              <CheckCircle size={48} className="text-green-500" />
              <h3 className="mt-4 text-2xl font-bold text-slate-800">No Anomalies Found</h3>
              <p className="mt-1 text-slate-500">All documents have passed verification successfully.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {safeSuspiciousGroups.map((group) => {
                const { Icon, color, text } = getSeverityInfo(group.suspicionLevel);
                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col gap-4 cursor-pointer transform transition-all hover:-translate-y-1 hover:shadow-lg"
                    onClick={() => setSelectedSuspiciousGroup(group)}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon size={28} className={color} />
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
                          <p className={`text-sm font-medium ${color}`}>{text} Severity</p>
                        </div>
                      </div>
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">{group.count} Files</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500">{group.description}</p>

                    {/* Reasons */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-600 text-sm">Detected Issues:</h4>
                      <ul className="space-y-1.5">
                        {group.reasons.map((reason, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <ListChecks size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Related Files */}
                    <div className="border-t border-slate-200 pt-4 mt-auto">
                      <h4 className="font-semibold text-slate-600 text-sm mb-2">Related Files:</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {group.files.map(fileId => {
                          const file = safeFiles.find(f => f.id === fileId);
                          return file ? (
                            <div key={fileId} className="flex items-center gap-2 bg-slate-50 text-slate-700 rounded-md px-2 py-1 text-xs">
                              <FileText size={14} />
                              <span>{file.name || file.original_name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* --- Standardized Floating Action Buttons --- */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
        <button onClick={() => setShowChatModal(true)} title="Chat with AI" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110">
          <MessageSquarePlus size={24} />
        </button>
        <button onClick={() => setShowUploadModal(true)} title="Upload Files" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110">
          <UploadCloud size={24} />
        </button>
      </div>
    </div>
  );
};

export default GroupsPage;