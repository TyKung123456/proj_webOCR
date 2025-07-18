import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
// --- ✨ Icon Imports ---
import {
  AlertTriangle, Eye, Trash2, Download, LineChart, MessageSquarePlus, UploadCloud,
  LayoutDashboard, Search, BarChart2, Files, CalendarClock, Loader, ScanEye,
  Menu, X, ChevronsLeft, ChevronsRight, FolderOpen, ArrowUp, ArrowDown,
  Sun, Moon, // Added for Dark Mode Toggle
} from 'lucide-react';

// --- ✨ Redesigned Components ---

// NOTE: For the toast to be dark, you need to set a theme on your ToastContainer
// e.g., <ToastContainer theme={isDarkMode ? "dark" : "light"} />
const ConfirmToast = ({ closeToast, onConfirm, message }) => (
  <div className="p-1">
    <div className="flex items-start gap-4">
      <AlertTriangle className="text-amber-500 mt-1" size={24} />
      <div>
        <p className="font-bold text-slate-800 dark:text-slate-100">Confirm Action</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </div>
    <div className="flex justify-end gap-3 mt-4">
      <button onClick={closeToast} className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-lg transition">Cancel</button>
      <button onClick={() => { onConfirm(); closeToast(); }} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">Yes, delete it</button>
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  // ✅ Enhanced status mapping to handle processing_status from database
  console.log('StatusPill received status:', status, 'type:', typeof status); // Debug log
  
  const statusMap = {
    'processed': {
      text: 'Processed',
      dot: 'bg-green-500',
      bg: 'bg-green-100 dark:bg-green-800',
      textC: 'text-green-800 dark:text-green-100',
    },
    'complete': {
      text: 'Complete',
      dot: 'bg-green-500',
      bg: 'bg-green-100 dark:bg-green-800',
      textC: 'text-green-800 dark:text-green-100',
    },
    'processing': {
      text: 'Processing',
      dot: 'bg-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-700',
      textC: 'text-blue-800 dark:text-blue-100',
    },
    'in_progress': {
      text: 'In Progress',
      dot: 'bg-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-700',
      textC: 'text-blue-800 dark:text-blue-100',
    },
    'pending': {
      text: 'Pending',
      dot: 'bg-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-800',
      textC: 'text-yellow-700 dark:text-yellow-200',
    },
    'no': {
      text: 'Not Processed',
      dot: 'bg-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800',
      textC: 'text-gray-700 dark:text-gray-200',
    },
    'failed': {
      text: 'Failed',
      dot: 'bg-red-500',
      bg: 'bg-red-100 dark:bg-red-800',
      textC: 'text-red-800 dark:text-red-100',
    },
    'error': {
      text: 'Error',
      dot: 'bg-red-500',
      bg: 'bg-red-100 dark:bg-red-800',
      textC: 'text-red-800 dark:text-red-100',
    },
    default: {
      text: status || 'Unknown',
      dot: 'bg-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800',
      textC: 'text-gray-700 dark:text-gray-200',
    },
  };

  // Handle null, undefined, or empty status
  if (!status) {
    console.log('Status is null/undefined/empty, using default');
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm ${statusMap.default.bg} ${statusMap.default.textC}`}>
        <span className={`h-2 w-2 rounded-full ${statusMap.default.dot}`}></span>
        No Status
      </span>
    );
  }

  // Normalize status to lowercase and handle different status formats
  const normalizedStatus = status.toString().toLowerCase().trim();
  console.log('Normalized status:', normalizedStatus);
  
  const current = statusMap[normalizedStatus] || statusMap.default;
  console.log('Using status config:', current);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm ${current.bg} ${current.textC}`}
    >
      <span className={`h-2 w-2 rounded-full ${current.dot}`}></span>
      {current.text}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700 transform transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.bg}`}>
        <Icon className={color.text} size={24} />
      </div>
    </div>
  </div>
);

const HomePage = ({
  files = [],
  deleteFile,
  setSelectedFile,
  setShowReportModal,
  currentDate,
  currentTime,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  setShowUploadModal,
  setShowChatModal
}) => {
  // --- ✨ Dark Mode State Management ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const today = new Date().toISOString().slice(0, 10);
  const [filterText, setFilterText] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });

  const filteredFiles = files.filter(file => {
    if (!filterText) return true;
    const lowercasedFilter = filterText.toLowerCase();
    // ✅ Updated to include processing_status, company_name, and pn_name in search
    const searchableContent = [
      file.id, 
      file.filename || file.name || file.original_name, 
      file.file_type || file.type, 
      file.processing_status,
      file.company_name,
      file.pn_name,
      file.work_detail
    ].join(' ').toLowerCase();
    return searchableContent.includes(lowercasedFilter);
  });

  const sortedFiles = useMemo(() => {
    let sortableItems = [...filteredFiles];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // ✅ Enhanced key mapping to handle database column names
        const keyMap = { 
          id: ['id'], 
          uploaded_at: ['uploaded_at', 'uploadedAt'], 
          name: ['filename', 'name', 'original_name'],
          type: ['file_type', 'type'],
          status: ['processing_status'],
          company_name: ['company_name'],
          pn_name: ['pn_name']
        };
        
        const getValue = (obj, key) => {
          const possibleKeys = keyMap[key] || [key];
          for (const possibleKey of possibleKeys) {
            if (obj[possibleKey] !== undefined && obj[possibleKey] !== null) {
              return obj[possibleKey];
            }
          }
          return null;
        };

        const valA = getValue(a, sortConfig.key);
        const valB = getValue(b, sortConfig.key);

        if (valA === null) return 1;
        if (valB === null) return -1;
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredFiles, sortConfig]);

  const totalPages = Math.ceil(sortedFiles.length / rowsPerPage);
  const paginatedFiles = sortedFiles.slice((currentTablePage - 1) * rowsPerPage, currentTablePage * rowsPerPage);
  useEffect(() => { setCurrentTablePage(1); }, [filterText, rowsPerPage, sortConfig]);

  const handleDeleteConfirm = (fileId) => {
    toast(
      ({ closeToast }) => <ConfirmToast closeToast={closeToast} onConfirm={() => deleteFile(fileId)} message="This action cannot be undone." />,
      { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
    );
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="inline-block ml-1" size={14} />
      : <ArrowDown className="inline-block ml-1" size={14} />;
  };

  const handleExportCSV = () => {
    const dataToExport = sortedFiles;
    if (dataToExport.length === 0) {
      toast.warn("No data available to export.");
      return;
    }

    // ✅ Updated CSV export to include all relevant fields from database
    const headersCSV = [
      'ID', 'File Name', 'Company Name', 'P/N Name', 'File Type', 
      'Upload Date', 'Processing Status', 'Work Detail'
    ].join(',');
    
    const rowsCSV = dataToExport.map(file => [
      file.id,
      `"${file.filename || file.name || file.original_name || 'Unknown'}"`,
      `"${file.company_name || ''}"`,
      `"${file.pn_name || ''}"`,
      `"${file.file_type || file.type || 'Unknown'}"`,
      `"${file.uploaded_at || file.uploadedAt || '-'}"`,
      `"${file.processing_status || 'Unknown'}"`,
      `"${file.work_detail || ''}"`
    ].join(','));

    const csvString = `${headersCSV}\n${rowsCSV.join('\n')}`;
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `files-export-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV file exported successfully!");
  };

  // ✅ Updated headers to include company and pn columns
  const headers = [
    { label: 'ID', key: 'id', sortable: true },
    { label: 'File Name', key: 'name', sortable: true },
    { label: 'Company', key: 'company_name', sortable: true },
    { label: 'P/N', key: 'pn_name', sortable: true },
    { label: 'Type', key: 'type', sortable: true },
    { label: 'Upload Date', key: 'uploaded_at', sortable: true },
    { label: 'Status', key: 'status', sortable: true },
    { label: '', key: 'actions', sortable: false }
  ];

  return (
    <div className="flex w-full bg-slate-50/50 dark:bg-slate-950">
      {/* --- Sidebar --- */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col border-r border-slate-200 dark:border-slate-700 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className={`flex items-center justify-between p-4 h-20 border-b border-slate-200 dark:border-slate-700 ${sidebarCollapsed && 'lg:justify-center'}`}>
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

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-8 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-800 dark:text-slate-200"><Menu size={24} /></button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">All Files</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="text-right">
              <div className="font-semibold text-slate-700 dark:text-slate-300">{currentDate}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{currentTime}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Files" value={files.length} icon={Files} color={{ bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }} />
            <StatCard title="Files Today" value={files.filter(f => (f.uploaded_at || f.uploadedAt || '').includes(today)).length} icon={CalendarClock} color={{ bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' }} />
            <StatCard title="Pending Review" value={files.filter(f => (f.processing_status || '').toLowerCase() === 'pending' || (f.processing_status || '').toLowerCase() === 'no').length} icon={Loader} color={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }} />
            <StatCard title="Processed" value={files.filter(f => (f.processing_status || '').toLowerCase() === 'complete' || (f.processing_status || '').toLowerCase() === 'processed').length} icon={ScanEye} color={{ bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' }} />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recent Files</h2>
              <div className="flex flex-wrap items-center gap-4">
                <input 
                  type="text" 
                  value={filterText} 
                  onChange={(e) => setFilterText(e.target.value)} 
                  placeholder="Search files, company, P/N..." 
                  className="px-4 py-2 border border-slate-300 rounded-lg w-full sm:w-80 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400 dark:focus:ring-indigo-500 dark:focus:border-indigo-500" 
                />
                <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition"><Download size={16} /> Export CSV</button>
                <button onClick={() => setShowReportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition"><LineChart size={16} /> Generate Report</button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    {headers.map(h => (
                      <th key={h.key} onClick={h.sortable ? () => requestSort(h.key) : undefined}
                        className={`px-6 py-4 text-left font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${h.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''}`}>
                        {h.label} {h.sortable && getSortIcon(h.key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedFiles.length > 0 ? (
                    paginatedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{file.id}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                          {file.filename || file.name || file.original_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                            🏢 {file.company_name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                            🔖 {file.pn_name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {file.file_type || file.type || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(file.uploaded_at || file.uploadedAt || Date.now()).toLocaleString('en-US', { 
                            dateStyle: 'short', 
                            timeStyle: 'short' 
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={file.processing_status} />
                          {/* Debug info - ลบออกหลังจากแก้ไขแล้ว */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-400 mt-1">
                              Debug: {JSON.stringify(file.processing_status)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => setSelectedFile(file)} 
                              title="View Details" 
                              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-md transition"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteConfirm(file.id)} 
                              title="Delete" 
                              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-md transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={headers.length} className="text-center py-16 text-slate-500 dark:text-slate-400">
                        <FolderOpen className="mx-auto text-slate-400 dark:text-slate-500" size={48} />
                        <p className="mt-4 font-semibold text-lg">No Files Found</p>
                        <p>{filterText ? 'Try adjusting your search.' : 'Upload a file to get started.'}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Page {currentTablePage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentTablePage(p => Math.max(p - 1, 1))} disabled={currentTablePage === 1} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Previous Page">
                      <ChevronsLeft size={18} />
                    </button>
                    <button onClick={() => setCurrentTablePage(p => Math.min(p + 1, totalPages))} disabled={currentTablePage === totalPages} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Next Page">
                      <ChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- Floating Action Buttons --- */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-40">
        <button onClick={() => setShowChatModal(true)} title="Chat with AI" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110">
          <MessageSquarePlus size={24} />
        </button>
        <button onClick={() => setShowUploadModal(true)} title="Upload File" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110">
          <UploadCloud size={24} />
        </button>
      </div>
    </div>
  );
};

export default HomePage;