// src/App.jsx - Fixed Version with CSS Loader

import React, { useState, useEffect } from 'react';

// Components and Services
import ApiService from './services/ApiService';
import HomePage from './pages/HomePage';
import GroupsPage from './pages/GroupsPage';
import DashboardPage from './pages/DashboardPage';
import UploadModal from './components/modals/UploadModal';
import FileDetailModal from './components/modals/FileDetailModal';
import ChatModal from './components/modals/ChatModal';
import ReportModal from './components/modals/ReportModal';

// UI Imports
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';

const FileUploadApp = () => {
  // --- ⭐️ เพิ่มส่วนนี้กลับเข้ามา ---
  // นี่คือส่วนสำคัญที่โหลด Tailwind CSS และสไตล์อื่นๆ จากโค้ดเดิมของคุณ
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    link.rel = 'stylesheet';
    link.id = 'tailwind-css';
    if (!document.getElementById('tailwind-css')) {
      document.head.appendChild(link);
    }

    const style = document.createElement('style');
    style.id = 'custom-styles'; // ใช้ ID ที่แตกต่างกันเล็กน้อยเพื่อความปลอดภัย
    style.textContent = `
      .font-sans { font-family: "Inter", sans-serif; } /* สมมติว่าใช้ฟอนต์ Inter */
      .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
      .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
      .from-gray-50 { --tw-gradient-from: #f9fafb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 250, 251, 0)); }
      .via-blue-50 { --tw-gradient-stops: var(--tw-gradient-from), #eff6ff, var(--tw-gradient-to, rgba(239, 246, 255, 0)); }
      .to-purple-50 { --tw-gradient-to: #faf5ff; }
      /* เพิ่มสไตล์อื่นๆ ที่จำเป็นตามโค้ด UI ใหม่ */
    `;
    if (!document.getElementById('custom-styles')) {
      document.head.appendChild(style);
    }

    return () => {
      const existingLink = document.getElementById('tailwind-css');
      const existingStyle = document.getElementById('custom-styles');
      if (existingLink) document.head.removeChild(existingLink);
      if (existingStyle) document.head.removeChild(existingStyle);
    };
  }, []);


  // --- State and Logic (เหมือนเดิม) ---
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [suspiciousGroups, setSuspiciousGroups] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'ai', text: 'สวัสดีครับ ผมสามารถช่วยวิเคราะห์ข้อมูลและตรวจสอบความน่าสงสัยของเอกสารได้ครับ' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [currentDate] = useState(new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  }));
  const [currentTime] = useState(new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit'
  }));

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getFiles();
      setFiles(response.data || []);
    } catch (err) {
      setError(err.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUploadSuccess = (uploadedFiles) => {
    toast.success(
      <div className="flex items-center gap-3">
        <CheckCircle size={20} />
        <span>{`${uploadedFiles.length} file(s) uploaded successfully!`}</span>
      </div>
    );
    setFiles(prev => [...uploadedFiles, ...prev]);
    setTimeout(loadFiles, 1000);
  };

  const handleFileDelete = async (fileId) => {
    try {
      await ApiService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success(
        <div className="flex items-center gap-3">
          <CheckCircle size={20} />
          <span>File deleted successfully!</span>
        </div>
      );
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-3">
          <XCircle size={20} />
          <span>{'Delete failed: ' + err.message}</span>
        </div>
      );
      loadFiles();
    }
  };

  const handleSendMessage = () => { /* ... Logic ... */ };

  const commonProps = {
    files, setFiles, suspiciousGroups, setSelectedFile, setShowReportModal,
    currentDate, currentTime, currentPage, setCurrentPage,
    sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed,
    setShowUploadModal, setShowChatModal, deleteFile: handleFileDelete
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-sans">
        <Loader className="animate-spin" size={48} />
        <p className="mt-4 text-lg font-medium">Loading Dashboard...</p>
        <p className="text-sm">Please wait a moment</p>
      </div>
    );
  }

  if (error && files.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans">
        <div className="text-center text-slate-600">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <h2 className="mt-4 text-2xl font-bold text-slate-800">Connection Error</h2>
          <p className="mt-2 max-w-md text-slate-500">{error}</p>
          <button onClick={loadFiles} className="mt-6 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Main Content & Modals */}
      {currentPage === 'home' && <HomePage {...commonProps} />}
      {currentPage === 'groups' && <GroupsPage {...commonProps} />}
      {currentPage === 'dashboard' && <DashboardPage {...commonProps} />}

      {selectedFile && <FileDetailModal file={selectedFile} onClose={() => setSelectedFile(null)} onDelete={handleFileDelete} />}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUploadSuccess={handleUploadSuccess} />}
      {showChatModal && <ChatModal onClose={() => setShowChatModal(false)} messages={chatMessages} inputMessage={inputMessage} setInputMessage={setInputMessage} onSendMessage={handleSendMessage} files={files} />}
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} reportType={reportType} setReportType={setReportType} reportDescription={reportDescription} setReportDescription={setReportDescription} />}

      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition:Slide
      />
    </div>
  );
};

export default FileUploadApp;