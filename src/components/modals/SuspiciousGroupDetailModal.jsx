// src/components/modals/SuspiciousGroupDetailModal.jsx - Modal แสดงข้อมูลเชิงลึกของกลุ่มเอกสารที่ตรวจพบว่าอาจผิดปกติ
import React from 'react';

const SuspiciousGroupDetailModal = ({ group, files, onClose, setSelectedFile, isPDFFile }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={(e) => {
      // Allow closing modal by clicking backdrop
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}
  >
    <div 
      className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col"
      style={{ maxHeight: '90vh' }}
      onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
    >
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className={`text-3xl ${
            group.suspicionLevel === 'high' ? 'text-red-500' :
            group.suspicionLevel === 'medium' ? 'text-yellow-500' : 'text-orange-500'
          }`}>
            {group.suspicionLevel === 'high' ? '🚨' : group.suspicionLevel === 'medium' ? '⚠️' : '🔍'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
        >
          <span className="text-xl text-gray-500">✕</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Anomaly Details */}
          <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${
            group.suspicionLevel === 'high' ? 'bg-red-50 border-red-200' :
            group.suspicionLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <h3 className="font-semibold text-gray-800 mb-2">Anomaly Details</h3>
            <p className="text-gray-700 mb-4">{group.description}</p>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Detected by System:</h4>
              <ul className="space-y-2">
                {group.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className={`mt-1 ${
                      group.suspicionLevel === 'high' ? 'text-red-500' :
                      group.suspicionLevel === 'medium' ? 'text-yellow-500' : 'text-orange-500'
                    }`}>
                      •
                    </span>
                    <span className="text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Related Documents - เพิ่มการแสดงจำนวนหน้า */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Related Documents ({group.count} Files)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.files.map(fileId => {
                const file = files.find(f => f.id === fileId);
                return (
                  <div key={fileId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl flex-shrink-0">📄</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-800 truncate">{file?.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">อัปโหลด: {file?.uploadedAt}</p>
                        <p className="text-sm text-gray-600">ประเภท: {file?.type}</p>

                        <div className="mt-3 bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-700 font-medium mb-1">ตัวอย่างข้อความ OCR:</p>
                          <p className="text-xs text-gray-600 break-words">
                            {file?.ocrText ? file.ocrText.substring(0, 150) + '...' : 'No OCR text available'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(file);
                          onClose();
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors duration-200"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">แนะนำการดำเนินการ</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• ตรวจสอบข้อมูลในเอกสารให้ละเอียด</p>
              <p>• เปรียบเทียบกับเอกสารต้นฉบับ</p>
              <p>• ติดต่อผู้เกี่ยวข้องเพื่อยืนยันข้อมูล</p>
              {group.suspicionLevel === 'high' && (
                <p className="text-red-600 font-medium">• ควรดำเนินการตรวจสอบเร่งด่วน</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SuspiciousGroupDetailModal;