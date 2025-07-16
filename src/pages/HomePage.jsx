// src/pages/HomePage.jsx - Updated Complete Version
import React from 'react';

const HomePage = ({ 
  files, deleteFile, setSelectedFile, setShowReportModal,
  currentDate, currentTime, currentPage, setCurrentPage,
  sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed,
  setShowUploadModal, setShowChatModal
}) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:relative lg:flex lg:flex-col ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      } w-64`}>
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${sidebarCollapsed ? 'lg:p-3' : ''}`}>
          {!sidebarCollapsed && (
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Menu
            </h2>
          )}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
            >
              <span className="text-lg text-gray-500">{sidebarCollapsed ? '→' : '←'}</span>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="text-xl text-gray-500">✕</span>
            </button>
          </div>
        </div>
        
        <nav className={`p-6 flex-1 ${sidebarCollapsed ? 'lg:p-3' : ''}`}>
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => { setCurrentPage('home'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentPage === 'home' ? 'bg-blue-100 text-blue-600 shadow-md' : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={sidebarCollapsed ? "Home" : ""}
              >
                <span className="text-xl">📄</span>
                {!sidebarCollapsed && <span className="font-medium">Home</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setCurrentPage('groups'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentPage === 'groups' ? 'bg-red-100 text-red-600 shadow-md' : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={sidebarCollapsed ? "Anomaly Detection" : ""}
              >
                <span className="text-xl">🔍</span>
                {!sidebarCollapsed && <span className="font-medium">Anomaly Detection</span>}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setCurrentPage('dashboard'); setSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentPage === 'dashboard' ? 'bg-blue-100 text-blue-600 shadow-md' : 'hover:bg-gray-100 text-gray-700'
                }`}
                title={sidebarCollapsed ? "Dashboard" : ""}
              >
                <span className="text-xl">📊</span>
                {!sidebarCollapsed && <span className="font-medium">Dashboard</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <span className="text-xl">☰</span>
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Customer File Dashboard
              </h1>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{currentDate}</div>
              <div className="text-sm text-gray-600">{currentTime}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800">{files.length}</h3>
                    <p className="text-gray-600">Total Files</p>
                  </div>
                  <div className="text-4xl text-blue-500">📄</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800">
                      {files.filter(f => {
                        const fileDate = f.uploadedAt || f.uploaded_at || '';
                        return fileDate.includes(today) || fileDate.includes('2025-07-09');
                      }).length}
                    </h3>
                    <p className="text-gray-600">Today's Files</p>
                  </div>
                  <div className="text-4xl text-green-500">📅</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800">
                      {files.filter(f => f.status === 'Processing').length}
                    </h3>
                    <p className="text-gray-600">Pending</p>
                  </div>
                  <div className="text-4xl text-yellow-500">⏳</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800">
                      {files.filter(f => f.status === 'Processed').length}
                    </h3>
                    <p className="text-gray-600">OCR Processed</p>
                  </div>
                  <div className="text-4xl text-purple-500">👁</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
                >
                  <span>📤</span>
                  <span>Upload Files</span>
                </button>
                <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105">
                  <span>📊</span>
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
                >
                  <span>📈</span>
                  <span>Generate Report</span>
                </button>
                <button 
                  onClick={() => setShowChatModal(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
                >
                  <span>💬</span>
                  <span>AI Assistant</span>
                </button>
              </div>
            </div>

            {/* Files Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Recent Files</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FILENAME</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPLOADED</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <div className="text-6xl mb-4">📂</div>
                          <p className="text-lg">No files found</p>
                          <p className="text-sm">Upload some files to get started!</p>
                          <button 
                            onClick={() => setShowUploadModal(true)}
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
                          >
                            Upload Your First File
                          </button>
                        </td>
                      </tr>
                    ) : (
                      files.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {file.name || file.original_name || file.filename || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {file.type || file.file_type || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {file.uploadedAt || file.uploaded_at || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              file.status === 'Processed' 
                                ? 'bg-green-100 text-green-800' 
                                : file.status === 'Processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {file.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedFile(file)}
                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                title="View Details"
                              >
                                👁
                              </button>
                              <button
                                onClick={() => alert('Download feature will be implemented')}
                                className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200"
                                title="Download"
                              >
                                ⬇️
                              </button>
                              <button
                                onClick={() => deleteFile(file.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-4 z-40">
        <button
          onClick={() => setShowChatModal(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110"
          title="Chat with AI"
        >
          <span className="text-2xl">💬</span>
        </button>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110"
          title="Upload Files"
        >
          <span className="text-2xl">📤</span>
        </button>
      </div>
    </div>
  );
};

export default HomePage;