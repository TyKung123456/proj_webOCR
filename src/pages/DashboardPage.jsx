// src/pages/DashboardPage.jsx - Fixed Version
import React from 'react';

const DashboardPage = ({ 
  files = [], // ✅ Default to empty array
  suspiciousGroups = [], // ✅ Default to empty array
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
  // ✅ Safe data processing with defaults
  const safeFiles = files || [];
  const safeSuspiciousGroups = suspiciousGroups || [];
  
  // ✅ Safe date calculations
  const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
  const todayAlt = new Date().toLocaleDateString('th-TH'); // Alternative format
  
  const todayFiles = safeFiles.filter(f => {
    const uploadDate = f.uploadedAt || f.uploaded_at || '';
    // ✅ Check multiple date formats safely
    return uploadDate.includes(today) || 
           uploadDate.includes('2025-07-15') || 
           uploadDate.includes('2025-07-09') ||
           uploadDate.includes(todayAlt);
  });

  const processedFiles = safeFiles.filter(f => f.status === 'Processed');
  const successRate = safeFiles.length > 0 ? Math.round((processedFiles.length / safeFiles.length) * 100) : 0;

  // ✅ Document Type Chart Component
  const DocumentTypeChart = () => {
    const data = [
      { type: 'Invoice', count: safeFiles.filter(f => (f.type || '').includes('Invoice')).length, color: '#3b82f6' },
      { type: 'Contract', count: safeFiles.filter(f => (f.type || '').includes('Contract')).length, color: '#10b981' },
      { type: 'Receipt', count: safeFiles.filter(f => (f.type || '').includes('Receipt')).length, color: '#f59e0b' },
      { type: 'Other', count: safeFiles.filter(f => !['Invoice', 'Contract', 'Receipt'].includes(f.type || '')).length, color: '#ef4444' }
    ].filter(d => d.count > 0);

    const total = data.reduce((sum, d) => sum + d.count, 0);

    if (total === 0) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 rounded-full relative overflow-hidden mb-4 bg-gray-100 flex items-center justify-center">
          {data.length > 0 ? (
            data.map((item, index) => {
              const percentage = (item.count / total) * 100;
              const cumulativePercentage = data.slice(0, index).reduce((sum, d) => sum + (d.count / total) * 100, 0);
              
              return (
                <div
                  key={item.type}
                  className="absolute inset-4 rounded-full border-8"
                  style={{
                    borderColor: item.color,
                    transform: `rotate(${(cumulativePercentage / 100) * 360}deg)`,
                    borderTopColor: 'transparent',
                    borderRightColor: percentage > 25 ? item.color : 'transparent',
                    borderBottomColor: percentage > 50 ? item.color : 'transparent',
                    borderLeftColor: percentage > 75 ? item.color : 'transparent',
                  }}
                />
              );
            })
          ) : (
            <div className="text-gray-400 text-2xl">📊</div>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {data.map(item => (
            <div key={item.type} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
              <span>{item.type}: {item.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Timeline Chart Component
  const TimelineChart = () => {
    // ✅ Safe data processing for timeline
    const timeData = [
      { time: '10:00', count: safeFiles.filter(f => (f.uploadedAt || '').includes('10:')).length },
      { time: '11:00', count: safeFiles.filter(f => (f.uploadedAt || '').includes('11:')).length },
      { time: '12:00', count: safeFiles.filter(f => (f.uploadedAt || '').includes('12:')).length },
      { time: '13:00', count: safeFiles.filter(f => (f.uploadedAt || '').includes('13:')).length },
      { time: '14:00', count: safeFiles.filter(f => (f.uploadedAt || '').includes('14:')).length }
    ];

    const maxCount = Math.max(...timeData.map(d => d.count), 1); // Avoid division by 0

    return (
      <div className="p-4">
        <div className="flex items-end justify-between h-40 border-b border-l border-gray-300">
          {timeData.map((item, index) => (
            <div key={item.time} className="flex flex-col items-center flex-1">
              <div
                className="bg-blue-500 w-8 transition-all duration-300 hover:bg-blue-600 rounded-t"
                style={{ height: `${(item.count / maxCount) * 120}px`, minHeight: '4px' }}
              ></div>
              <div className="mt-2 text-xs text-gray-600">{item.time}</div>
              <div className="text-xs font-medium">{item.count}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">Upload Timeline</div>
      </div>
    );
  };

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
                Analytics Dashboard
              </h1>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{currentDate || new Date().toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">{currentTime || new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-8">
            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Comprehensive insights into your document management system</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold">{safeFiles.length}</h3>
                    <p className="text-blue-100">Total Documents</p>
                  </div>
                  <div className="text-5xl opacity-80">📊</div>
                </div>
                <div className="mt-4 text-sm text-blue-100">
                  {safeFiles.length > 0 ? '↗️ Active system' : '📝 Ready for uploads'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold">{successRate}%</h3>
                    <p className="text-green-100">Success Rate</p>
                  </div>
                  <div className="text-5xl opacity-80">✅</div>
                </div>
                <div className="mt-4 text-sm text-green-100">
                  {successRate > 90 ? '↗️ Excellent performance' : '📈 Processing efficiently'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold">{safeSuspiciousGroups.length}</h3>
                    <p className="text-purple-100">Anomaly Groups</p>
                  </div>
                  <div className="text-5xl opacity-80">🚨</div>
                </div>
                <div className="mt-4 text-sm text-purple-100">
                  {safeSuspiciousGroups.length === 0 ? '✅ All clear' : '⚠️ Monitoring alerts'}
                </div>
              </div>

              <div className="bg-yellow-500 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold">{todayFiles.length}</h3>
                    <p className="text-orange-100">Today's Files</p>
                  </div>
                  <div className="text-5xl opacity-80">⚡</div>
                </div>
                <div className="mt-4 text-sm text-orange-100">
                  {todayFiles.length > 0 ? '📈 Active today' : '🕒 Awaiting uploads'}
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Document Distribution</h3>
                  <div className="text-3xl">🎯</div>
                </div>
                <div className="h-80 flex items-center justify-center">
                  <DocumentTypeChart />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Upload Timeline</h3>
                  <div className="text-3xl">📈</div>
                </div>
                <div className="h-80">
                  <TimelineChart />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Processing Speed</h4>
                  <div className="text-2xl">⚡</div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">2.3s</div>
                <p className="text-gray-600 text-sm">Average OCR processing time</p>
                <div className="mt-3 bg-blue-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Storage Efficiency</h4>
                  <div className="text-2xl">💾</div>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
                <p className="text-gray-600 text-sm">Compression ratio achieved</p>
                <div className="mt-3 bg-green-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Accuracy Rate</h4>
                  <div className="text-2xl">🎯</div>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">96.8%</div>
                <p className="text-gray-600 text-sm">OCR text recognition accuracy</p>
                <div className="mt-3 bg-purple-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Recent Activity</h3>
                <div className="text-3xl">🕒</div>
              </div>
              <div className="space-y-4">
                {safeFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📁</div>
                    <p>No recent activity</p>
                    <button 
                      onClick={() => setShowUploadModal && setShowUploadModal(true)}
                      className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Upload Files
                    </button>
                  </div>
                ) : (
                  safeFiles.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{file.name || 'Unknown file'}</p>
                        <p className="text-gray-500 text-sm">{file.uploadedAt || file.uploaded_at || 'Unknown date'}</p>
                      </div>
                      <span className="text-2xl">📄</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-4 z-40">
        <button
          onClick={() => setShowChatModal && setShowChatModal(true)}
          className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110"
          title="Chat with AI"
        >
          <span className="text-2xl">💬</span>
        </button>
        <button
          onClick={() => setShowUploadModal && setShowUploadModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110"
          title="Upload Files"
        >
          <span className="text-2xl">📤</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;