// src/App.jsx - Updated with Real File Upload Integration
import React, { useState, useEffect } from 'react';
import ApiService from './services/ApiService';
import HomePage from './pages/HomePage';
import GroupsPage from './pages/GroupsPage';
import DashboardPage from './pages/DashboardPage';
import UploadModal from './components/modals/UploadModal';
import FileDetailModal from './components/modals/FileDetailModal';
import ChatModal from './components/modals/ChatModal';
import ReportModal from './components/modals/ReportModal';

const FileUploadApp = () => {
  // ✅ Load CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    link.rel = 'stylesheet';
    link.id = 'tailwind-css';
    if (!document.getElementById('tailwind-css')) {
      document.head.appendChild(link);
    }

    const style = document.createElement('style');
    style.id = 'custom-gradients';
    style.textContent = `
      .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
      .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
      .from-gray-50 { --tw-gradient-from: #f9fafb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 250, 251, 0)); }
      .via-blue-50 { --tw-gradient-stops: var(--tw-gradient-from), #eff6ff, var(--tw-gradient-to, rgba(239, 246, 255, 0)); }
      .to-purple-50 { --tw-gradient-to: #faf5ff; }
      .from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(37, 99, 235, 0)); }
      .to-purple-600 { --tw-gradient-to: #9333ea; }
      .bg-clip-text { -webkit-background-clip: text; background-clip: text; }
      .text-transparent { color: transparent; }
      .hover\\:scale-105:hover { transform: scale(1.05); }
      .transform { transform: translateX(var(--tw-translate-x, 0)) translateY(var(--tw-translate-y, 0)); }
      .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
      .duration-300 { transition-duration: 300ms; }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
      .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    if (!document.getElementById('custom-gradients')) {
      document.head.appendChild(style);
    }

    return () => {
      const existingLink = document.getElementById('tailwind-css');
      const existingStyle = document.getElementById('custom-gradients');
      if (existingLink && document.head.contains(existingLink)) {
        document.head.removeChild(existingLink);
      }
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  // ✅ Core State
  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // ✅ Files State - Now from real API
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Modal States
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // ✅ Other States
  const [suspiciousGroups, setSuspiciousGroups] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'ai', text: 'สวัสดีครับ ผมสามารถช่วยวิเคราะห์ข้อมูลและตรวจสอบความน่าสงสัยของเอกสารได้ครับ' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }));
  const [currentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  }));

  // ✅ Load files from API
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📁 Loading files from API...');
      const response = await ApiService.getFiles();
      
      console.log('✅ Files loaded:', response.data.length);
      setFiles(response.data || []);
      
    } catch (err) {
      console.error('❌ Error loading files:', err);
      setError(err.message);
      
      // Keep empty array instead of dummy data for real app
      setFiles([]);
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load files on component mount
  useEffect(() => {
    loadFiles();
    
    // Check API health
    ApiService.healthCheck()
      .then(() => console.log('✅ API health check passed'))
      .catch(err => console.warn('⚠️ API health check failed:', err.message));
  }, []);

  // ✅ Handle successful upload
  const handleUploadSuccess = (uploadedFiles) => {
    console.log('🎉 Upload successful, refreshing file list...');
    
    // Add new files to state immediately for better UX
    setFiles(prev => [...uploadedFiles, ...prev]);
    
    // Refresh from API to ensure consistency
    setTimeout(loadFiles, 1000);
  };

  // ✅ Handle file deletion
  const handleFileDelete = async (fileId) => {
    try {
      await ApiService.deleteFile(fileId);
      
      // Remove from state immediately
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      console.log('✅ File deleted successfully');
      
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Delete failed: ' + err.message);
      
      // Refresh list in case of inconsistency
      loadFiles();
    }
  };

  // ✅ Handle chat messages
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage = { id: chatMessages.length + 1, type: 'user', text: inputMessage };
    setChatMessages(prev => [...prev, newMessage]);
    
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2, 
        type: 'ai',
        text: 'ได้รับข้อความแล้วครับ! ให้ผมช่วยตรวจสอบความน่าสงสัยหรือวิเคราะห์ข้อมูลอะไรดีครับ?',
        chart: /กราฟ|chart/i.test(inputMessage)
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
    
    setInputMessage('');
  };

  // ✅ Common props for all pages
  const commonProps = { 
    files, 
    setFiles,
    suspiciousGroups, 
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
    setShowChatModal,
    deleteFile: handleFileDelete
  };

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading files...</p>
          <p className="text-sm text-gray-500">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // ✅ Show error state
  if (error && files.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-4">
            <button
              onClick={loadFiles}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              🔄 Retry Connection
            </button>
            <div className="text-sm text-gray-500">
              <p>Make sure the backend server is running on:</p>
              <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3001</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Error banner for API issues */}
      {error && files.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                API Warning: {error}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={loadFiles}
                  className="text-yellow-500 hover:text-yellow-600 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentPage === 'home' && <HomePage {...commonProps} />}
      {currentPage === 'groups' && <GroupsPage {...commonProps} />}
      {currentPage === 'dashboard' && <DashboardPage {...commonProps} />}
      
      {/* Modals */}
      {selectedFile && (
        <FileDetailModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)}
          onDelete={handleFileDelete}
        />
      )}
      
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
      
      {showChatModal && (
        <ChatModal 
          onClose={() => setShowChatModal(false)}
          messages={chatMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          files={files}
        />
      )}
      
      {showReportModal && (
        <ReportModal 
          onClose={() => setShowReportModal(false)}
          reportType={reportType}
          setReportType={setReportType}
          reportDescription={reportDescription}
          setReportDescription={setReportDescription}
        />
      )}
    </div>
  );
};

export default FileUploadApp;