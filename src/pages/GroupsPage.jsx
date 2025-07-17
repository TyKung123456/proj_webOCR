// src/pages/GroupsPage.jsx - หน้าสำหรับแสดงกลุ่มเอกสารผิดปกติ (Anomaly Groups) ที่ตรวจจับโดยระบบ
import React from 'react';

const GroupsPage = ({ 
  files, suspiciousGroups, setSelectedSuspiciousGroup,
  currentDate, currentTime, currentPage, setCurrentPage,
  sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed,
  setShowUploadModal, setShowChatModal, isPDFFile
}) => {
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
              <h1 className="text-2xl font-bold text-gray-900">Anomaly Detection</h1>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{currentDate}</div>
              <div className="text-sm text-gray-600">{currentTime}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-red-600">
                    Anomaly Detection
                  </h1>
                  <p className="text-gray-600 mt-2">System groups documents with anomalies or incorrect data</p>
                </div>
              </div>
            </div>

            {suspiciousGroups.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">No Anomalies Found</h3>
                <p className="text-gray-600">All documents have passed verification successfully. No anomalies detected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {suspiciousGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`bg-white rounded-xl shadow-lg p-6 border-l-4 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      group.suspicionLevel === 'high' ? 'border-red-500' :
                      group.suspicionLevel === 'medium' ? 'border-yellow-500' : 'border-orange-500'
                    }`}
                    onClick={() => setSelectedSuspiciousGroup(group)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`text-3xl ${
                          group.suspicionLevel === 'high' ? 'text-red-500' :
                          group.suspicionLevel === 'medium' ? 'text-yellow-500' : 'text-orange-500'
                        }`}>
                          {group.suspicionLevel === 'high' ? '🚨' : group.suspicionLevel === 'medium' ? '⚠️' : '🔍'}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{group.name}</h3>
                          <p className={`text-sm font-medium ${
                            group.suspicionLevel === 'high' ? 'text-red-600' :
                            group.suspicionLevel === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                          }`}>
                            Anomaly Level: {group.suspicionLevel === 'high' ? 'High' : group.suspicionLevel === 'medium' ? 'Medium' : 'Low'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        group.suspicionLevel === 'high' ? 'bg-red-100 text-red-800' :
                        group.suspicionLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {group.count} Files
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">{group.description}</p>

                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Detected Issues:</h4>
                      <ul className="space-y-1">
                        {group.reasons.map((reason, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                            <span className="text-red-500">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Related Files - เพิ่มการแสดงจำนวนหน้า */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 flex-wrap">
                        {group.files.map(fileId => {
                          const file = files.find(f => f.id === fileId);
                          return (
                            <div key={fileId} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2 mb-2">
                              <span className="text-lg">📄</span>
                              <span className="text-xs text-gray-700">{file?.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <span className="text-sm text-blue-600 font-medium">Click for details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default GroupsPage;