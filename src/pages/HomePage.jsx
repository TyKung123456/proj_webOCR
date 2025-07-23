import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
// --- ✨ Icon Imports (Updated) ---
import {
  AlertTriangle, Eye, Trash2, Download, LineChart, MessageSquarePlus, UploadCloud,
  LayoutDashboard, Search, BarChart2, Files, CalendarClock, Loader, ScanEye,
  Menu, X, ChevronsLeft, ChevronsRight, FolderOpen, ArrowUp, ArrowDown,
  Sun, Moon, CheckCircle2, XCircle, HelpCircle, Filter, List, LayoutGrid, FileText, Building, Fingerprint, MousePointerClick
} from 'lucide-react';

// --- ✨ Reusable Components ---

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
      <button onClick={() => { onConfirm(); closeToast(); }} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">Yes, confirm</button>
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const statusMap = { 'processed': { text: 'Processed', dot: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-800', textC: 'text-green-800 dark:text-green-100' }, 'complete': { text: 'Complete', dot: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-800', textC: 'text-green-800 dark:text-green-100' }, 'processing': { text: 'Processing', dot: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-700', textC: 'text-blue-800 dark:text-blue-100' }, 'in_progress': { text: 'In Progress', dot: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-700', textC: 'text-blue-800 dark:text-blue-100' }, 'pending': { text: 'Pending', dot: 'bg-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-800', textC: 'text-yellow-700 dark:text-yellow-200' }, 'no': { text: 'Not Processed', dot: 'bg-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', textC: 'text-gray-700 dark:text-gray-200' }, 'failed': { text: 'Failed', dot: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-800', textC: 'text-red-800 dark:text-red-100' }, 'error': { text: 'Error', dot: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-800', textC: 'text-red-800 dark:text-red-100' }, default: { text: status || 'Unknown', dot: 'bg-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', textC: 'text-gray-700 dark:text-gray-200' }, };
  if (!status) { return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-xs ${statusMap.default.bg} ${statusMap.default.textC}`}><span className={`h-1.5 w-1.5 rounded-full ${statusMap.default.dot}`}></span>No Status</span>; }
  const normalizedStatus = status.toString().toLowerCase().trim();
  const current = statusMap[normalizedStatus] || statusMap.default;
  return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-xs ${current.bg} ${current.textC}`}><span className={`h-1.5 w-1.5 rounded-full ${current.dot}`}></span>{current.text}</span>;
};

const SimilarityStatusPill = ({ status }) => {
  const normalizedStatus = status?.toLowerCase().trim() || 'unknown';
  const statusMap = { 'matched': { text: 'Matched', bg: 'bg-purple-100 dark:bg-purple-800', textC: 'text-purple-800 dark:text-purple-100', dot: 'bg-purple-500' }, 'no match': { text: 'No Match', bg: 'bg-slate-100 dark:bg-slate-800', textC: 'text-slate-700 dark:text-slate-200', dot: 'bg-slate-400' }, 'requires review': { text: 'Review', bg: 'bg-orange-100 dark:bg-orange-800', textC: 'text-orange-800 dark:text-orange-100', dot: 'bg-orange-400' }, 'unknown': { text: 'Unknown', bg: 'bg-gray-100 dark:bg-gray-800', textC: 'text-gray-700 dark:text-gray-200', dot: 'bg-gray-400' } };
  const current = statusMap[normalizedStatus] || statusMap.unknown;
  const displayText = statusMap[normalizedStatus] ? current.text : (status || 'Unknown');
  return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-xs ${current.bg} ${current.textC}`}><span className={`h-1.5 w-1.5 rounded-full ${current.dot}`}></span>{displayText}</span>;
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
    <div className="flex items-center justify-between"><div className="space-y-1"><p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p><p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p></div><div className={`p-3 rounded-full ${color.bg}`}><Icon className={color.text} size={24} /></div></div>
  </div>
);

const FileCard = ({ file, isSelected, onSelect, onCardClick, isSelectionMode }) => {
  const isFail = file.quality_check_status?.toLowerCase() === 'fail';

  return (
    <div
      onClick={() => isSelectionMode ? onSelect(file.id) : onCardClick(file)}
      className={`relative border rounded-2xl shadow-sm transition-all duration-300 ease-in-out cursor-pointer 
        ${isSelectionMode ? 'hover:shadow-md' : 'hover:shadow-xl hover:-translate-y-1'} 
        ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : ''}
        {/* <<< ✅ MODIFIED: ปรับสีแดงให้เข้มและชัดเจนขึ้น >>> */}
        ${isFail ? 'bg-red-100 dark:bg-red-900/60 border-red-300 dark:border-red-800/60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
    >
      {isSelectionMode && (
        <div className="absolute top-3 left-3" onClick={e => e.stopPropagation()}>
          <input type="checkbox" className="form-checkbox h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500" checked={isSelected} onChange={() => onSelect(file.id)} />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg mt-1 ${isSelectionMode ? 'ml-8' : ''} ${isFail ? 'bg-red-200 dark:bg-red-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10'}`}>
            {isFail ? <AlertTriangle className="text-red-600 dark:text-red-400" size={24} /> : <FileText className="text-indigo-600 dark:text-indigo-400" size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate" title={file.filename}>{file.filename || 'Unknown'}</p>
            <p className="text-sm text-slate-400">ID: {file.id}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 text-sm"><div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Building size={16} /><span>{file.company_name || '-'}</span></div><div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Fingerprint size={16} /><span>{file.pn_name || '-'}</span></div></div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <StatusPill status={file.processing_status} />
          <SimilarityStatusPill status={file.similarity_status} />
        </div>
      </div>
    </div>
  );
};

const HomePage = ({
  files = [], deleteFile, setSelectedFile, setShowReportModal, currentDate, currentTime, currentPage,
  setCurrentPage, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, setShowUploadModal, setShowChatModal
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => { const savedMode = localStorage.getItem('darkMode'); return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches; });
  useEffect(() => { if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);

  const today = new Date().toISOString().slice(0, 10);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterText, setFilterText] = useState('');
  const [filterProcessingStatus, setFilterProcessingStatus] = useState('all');
  const [filterQualityCheck, setFilterQualityCheck] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });

  const filteredFiles = useMemo(() => files.filter(file => {
    const lowercasedFilter = filterText.toLowerCase();
    const searchableContent = [file.id, file.filename, file.company_name, file.pn_name].join(' ').toLowerCase();
    if (filterText && !searchableContent.includes(lowercasedFilter)) return false;
    if (filterProcessingStatus !== 'all' && (file.processing_status || '').toLowerCase() !== filterProcessingStatus) return false;
    if (filterQualityCheck !== 'all' && (file.quality_check_status || '').toLowerCase() !== filterQualityCheck) return false;
    return true;
  }), [files, filterText, filterProcessingStatus, filterQualityCheck]);

  const sortedFiles = useMemo(() => {
    let sortableItems = [...filteredFiles];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const keyMap = { id: ['id'], uploaded_at: ['uploaded_at', 'uploadedAt'], name: ['filename', 'name', 'original_name'], processing_status: ['processing_status'], company_name: ['company_name'], pn_name: ['pn_name'], quality_check_status: ['quality_check_status'] };
        const getValue = (obj, key) => { const pKeys = keyMap[key] || [key]; for (const pKey of pKeys) { if (obj[pKey] !== undefined && obj[pKey] !== null) return obj[pKey]; } return null; };
        const valA = getValue(a, sortConfig.key); const valB = getValue(b, sortConfig.key);
        if (valA === null) return 1; if (valB === null) return -1;
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredFiles, sortConfig]);

  const paginatedFiles = useMemo(() => sortedFiles.slice((currentTablePage - 1) * rowsPerPage, currentTablePage * rowsPerPage), [sortedFiles, currentTablePage, rowsPerPage]);

  useEffect(() => { setCurrentTablePage(1); }, [filterText, rowsPerPage, sortConfig, filterProcessingStatus, filterQualityCheck, viewMode]);
  useEffect(() => { setSelectedIds(new Set()); }, [filteredFiles, viewMode, isSelectionMode]);

  // <<< ✅ MODIFIED: ทำให้ Export CSV ใช้งานได้จริง >>>
  const handleExportCSV = () => {
    if (filteredFiles.length === 0) {
      toast.warn("No data available to export.");
      return;
    }

    const headers = [
      'ID', 'File Name', 'Company', 'PN Name', 'Uploaded At',
      'Processing Status', 'Similarity Status', 'Quality Check Status'
    ];

    const formatCSVField = (data) => {
      if (data === null || data === undefined) return '';
      let field = String(data);
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        field = `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvRows = filteredFiles.map(file => [
      file.id,
      formatCSVField(file.filename),
      formatCSVField(file.company_name),
      formatCSVField(file.pn_name),
      new Date(file.uploadedAt || file.uploaded_at || Date.now()).toISOString(),
      formatCSVField(file.processing_status),
      formatCSVField(file.similarity_status),
      formatCSVField(file.quality_check_status)
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("href", url);
      link.setAttribute("download", `file_export_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Successfully exported ${filteredFiles.length} records.`);
    } else {
      toast.error("CSV export is not supported by your browser.");
    }
  };

  const handleToggleSelectionMode = () => { setIsSelectionMode(prev => !prev); };
  const handleDeleteConfirm = (fileId) => { toast(({ closeToast }) => <ConfirmToast closeToast={closeToast} onConfirm={() => { deleteFile(fileId); setSelectedIds(prev => { const next = new Set(prev); next.delete(fileId); return next; }); }} message="This action cannot be undone." />, { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }); };
  const requestSort = (key) => { let direction = 'ascending'; if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending'; setSortConfig({ key, direction }); };
  const getSortIcon = (key) => { if (sortConfig.key !== key) return null; return sortConfig.direction === 'ascending' ? <ArrowUp className="inline-block ml-1" size={14} /> : <ArrowDown className="inline-block ml-1" size={14} />; };
  const handleSelectAll = (e) => { if (e.target.checked) { setSelectedIds(new Set(paginatedFiles.map(f => f.id))); } else { setSelectedIds(new Set()); } };
  const handleSelectOne = (id) => { setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) { next.delete(id); } else { next.add(id); } return next; }); };
  const handleBulkDelete = () => { if (selectedIds.size === 0) return; toast(({ closeToast }) => <ConfirmToast closeToast={closeToast} onConfirm={() => { Array.from(selectedIds).forEach(id => deleteFile(id)); setSelectedIds(new Set()); }} message={`You are about to delete ${selectedIds.size} file(s). This action cannot be undone.`} />, { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }); };

  const tableHeaders = [
    { label: isSelectionMode ? <input type="checkbox" className="form-checkbox rounded text-indigo-600 focus:ring-indigo-500" onChange={handleSelectAll} checked={paginatedFiles.length > 0 && selectedIds.size === paginatedFiles.length} /> : null, key: 'select', sortable: false },
    { label: '', key: 'status_icon', sortable: false },
    { label: 'ID', key: 'id', sortable: true }, { label: 'File Name', key: 'name', sortable: true }, { label: 'Company', key: 'company_name', sortable: false }, { label: 'PN Name', key: 'pn_name', sortable: false }, { label: 'Upload Date', key: 'uploaded_at', sortable: true }, { label: 'Processing Status', key: 'processing_status', sortable: true }, { label: 'Similarity Status', key: 'similarity_status', sortable: false }, { label: 'Actions', key: 'actions', sortable: false }
  ];

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-100/50 dark:bg-slate-950">
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col border-r border-slate-200 dark:border-slate-800 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className={`flex items-center justify-between p-4 h-20 border-b border-slate-200 dark:border-slate-800 ${sidebarCollapsed && 'lg:justify-center'}`}>{!sidebarCollapsed && <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard</span>}<button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}</button><button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} /></button></div>
        <nav className="flex-1 p-4 space-y-2">{[{ name: 'Home', icon: LayoutDashboard, page: 'home' }, { name: 'Detection', icon: Search, page: 'groups' }, { name: 'Analytics', icon: BarChart2, page: 'dashboard' }].map(item => (<button key={item.name} onClick={() => { setCurrentPage(item.page); setSidebarOpen(false); }} title={sidebarCollapsed ? item.name : ''} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.page ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'} ${sidebarCollapsed && 'justify-center'}`} ><item.icon size={20} />{!sidebarCollapsed && <span>{item.name}</span>}</button>))}</nav>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-8 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-4"><button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-800 dark:text-slate-200"><Menu size={24} /></button><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">All Files</h1></div>
          <div className="flex items-center gap-4"><button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button><div className="text-right"><div className="font-semibold text-slate-700 dark:text-slate-300">{currentDate}</div><div className="text-sm text-slate-500 dark:text-slate-400">{currentTime}</div></div></div>
        </header>

        <main className="flex-1 p-8 space-y-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Files" value={files.length} icon={Files} color={{ bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }} />
            <StatCard title="Files Today" value={files.filter(f => (f.uploaded_at || f.uploadedAt || '').includes(today)).length} icon={CalendarClock} color={{ bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' }} />
            <StatCard title="Pending Review" value={files.filter(f => (f.processing_status || '').toLowerCase() === 'pending' || (f.processing_status || '').toLowerCase() === 'no').length} icon={Loader} color={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }} />
            <StatCard title="Processed" value={files.filter(f => (f.processing_status || '').toLowerCase() === 'complete' || (f.processing_status || '').toLowerCase() === 'processed').length} icon={ScanEye} color={{ bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' }} />
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/50">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-grow min-w-[250px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Search by name, company, or P/N..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400 dark:focus:ring-indigo-500 dark:focus:border-indigo-500" /></div>
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1"><Filter size={16} className="text-slate-500 dark:text-slate-400" /><select value={filterProcessingStatus} onChange={e => setFilterProcessingStatus(e.target.value)} className="px-2 py-1.5 border-0 bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-0 outline-none"><option value="all">All Statuses</option><option value="complete">Complete</option><option value="processing">Processing</option><option value="pending">Pending</option><option value="failed">Failed</option></select></div>
                  <div className="flex items-center gap-1"><select value={filterQualityCheck} onChange={e => setFilterQualityCheck(e.target.value)} className="px-2 py-1.5 border-0 bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 focus:ring-0 outline-none"><option value="all">All Quality</option><option value="pass">Pass</option><option value="fail">Fail</option></select></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportCSV} disabled={filteredFiles.length === 0} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105">
                    <Download size={16} /> Export CSV
                  </button>
                  <button onClick={() => setShowReportModal(true)} disabled={files.length === 0} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105">
                    <LineChart size={16} /> Generate Report
                  </button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <button onClick={handleToggleSelectionMode} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isSelectionMode ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'}`}>
                    {isSelectionMode ? <X size={16} /> : <MousePointerClick size={16} />}
                    {isSelectionMode ? 'Cancel' : 'Select'}
                  </button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}><List size={20} /></button>
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}><LayoutGrid size={20} /></button>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">{paginatedFiles.length > 0 ? paginatedFiles.map(file => (<FileCard key={file.id} file={file} isSelected={selectedIds.has(file.id)} onSelect={handleSelectOne} onCardClick={setSelectedFile} isSelectionMode={isSelectionMode} />)) : (<div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400"><FolderOpen className="mx-auto text-slate-400 dark:text-slate-500" size={48} /><p className="mt-4 font-semibold text-lg">No Files Found</p><p>Try adjusting your search or filters.</p></div>)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                        {tableHeaders.map(h => (
                          <th key={h.key} onClick={h.sortable && h.key !== 'select' && h.key !== 'status_icon' ? () => requestSort(h.key) : undefined}
                            className={`px-3 py-4 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${h.key === 'id' ? 'text-center' : 'text-left'} ${h.sortable && h.key !== 'select' && h.key !== 'status_icon' ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : 'cursor-default'}`}>
                            {h.label} {h.sortable && getSortIcon(h.key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedFiles.length > 0 ? (paginatedFiles.map((file) => {
                        const isSelected = selectedIds.has(file.id);
                        const isFail = file.quality_check_status?.toLowerCase() === 'fail';

                        let rowClass = 'transition-colors duration-200 cursor-pointer';
                        if (isSelected) {
                          rowClass += ' bg-indigo-100 dark:bg-indigo-900/50';
                        } else if (isFail) {
                          // <<< ✅ MODIFIED: ปรับสีแดงให้เข้มและชัดเจนขึ้น >>>
                          rowClass += ' bg-red-100 hover:bg-red-200/60 dark:bg-red-900/60 dark:hover:bg-red-900/80';
                        } else {
                          rowClass += ' hover:bg-slate-50 dark:hover:bg-slate-800 even:bg-slate-50/50 dark:even:bg-slate-800/50';
                        }

                        return (
                          <tr key={file.id} onClick={() => isSelectionMode ? handleSelectOne(file.id) : setSelectedFile(file)} className={rowClass}>
                            <td className="px-3 py-3 w-12 text-center" onClick={e => e.stopPropagation()}>{isSelectionMode && <input type="checkbox" className="form-checkbox h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-indigo-500" checked={isSelected} onChange={() => handleSelectOne(file.id)} />}</td>
                            <td className="px-3 py-3 w-8 text-center">
                              {file.quality_check_status?.toLowerCase() === 'pass' && <CheckCircle2 className="text-green-500 mx-auto" size={18} />}
                              {file.quality_check_status?.toLowerCase() === 'fail' && <XCircle className="text-red-500 mx-auto" size={18} />}
                            </td>
                            <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400 font-mono">{file.id}</td>
                            <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100 break-words">{file.filename || 'Unknown'}</td>
                            <td className="px-3 py-3 text-slate-500 dark:text-slate-400 break-words">{file.company_name || '-'}</td>
                            <td className="px-3 py-3 text-slate-500 dark:text-slate-400 break-words">{file.pn_name || '-'}</td>
                            <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{new Date(file.uploadedAt || file.uploaded_at || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                            <td className="px-3 py-3 text-center"><StatusPill status={file.processing_status} /></td>
                            <td className="px-3 py-3 text-center"><SimilarityStatusPill status={file.similarity_status} /></td>
                            <td className="px-3 py-3"><div className="flex justify-center items-center gap-2"><button onClick={(e) => { e.stopPropagation(); setSelectedFile(file); }} title="View Details" className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-md transition"><Eye size={18} /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(file.id); }} title="Delete" className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-md transition"><Trash2 size={18} /></button></div></td>
                          </tr>
                        );
                      })) : (<tr><td colSpan={tableHeaders.length} className="text-center py-16 text-slate-500 dark:text-slate-400"><FolderOpen className="mx-auto text-slate-400 dark:text-slate-500" size={48} /><p className="mt-4 font-semibold text-lg">No Files Found</p><p>Try adjusting your search or filters.</p></td></tr>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex-1 min-h-[36px]">
                {isSelectionMode && selectedIds.size > 0 && (
                  <div className="flex items-center gap-3"><span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedIds.size} item(s) selected</span><button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 font-semibold rounded-lg shadow-sm hover:bg-red-200 transition text-sm dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"><Trash2 size={16} /> Delete Selected</button></div>
                )}
              </div>
              <div className="flex items-center gap-3"><span className="text-sm text-slate-600 dark:text-slate-400">Page {currentTablePage} of {Math.ceil(sortedFiles.length / rowsPerPage) || 1}</span><div className="flex items-center gap-1"><button onClick={() => setCurrentTablePage(p => Math.max(p - 1, 1))} disabled={currentTablePage === 1} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Previous Page"><ChevronsLeft size={18} /></button><button onClick={() => setCurrentTablePage(p => Math.min(p + 1, Math.ceil(sortedFiles.length / rowsPerPage)))} disabled={currentTablePage * rowsPerPage >= sortedFiles.length} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Next Page"><ChevronsRight size={18} /></button></div></div>
            </div>
          </div>
        </main>
      </div>
      <div className="fixed bottom-8 right-8 flex flex-row gap-4 z-40"><button onClick={() => setShowChatModal(true)} title="Chat with AI" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110"><MessageSquarePlus size={24} /></button><button onClick={() => setShowUploadModal(true)} title="Upload File" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110"><UploadCloud size={24} /></button></div>
    </div>
  );
};

export default HomePage;