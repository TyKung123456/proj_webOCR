// src/components/modals/ReportModal.jsx - Modal แสดงรายงานหรือกราฟสรุปของไฟล์หรือกลุ่มที่เลือก (Fixed Scroll Issue)
import React from 'react';

const ReportModal = ({ onClose, reportType, setReportType, reportDescription, setReportDescription }) => {
  const chartTypes = [
    { id: 'pie', name: 'Pie Chart', description: 'แสดงสัดส่วนประเภทเอกสาร', icon: '🥧' },
    { id: 'bar', name: 'Bar Chart', description: 'เปรียบเทียบจำนวนเอกสารแต่ละประเภท', icon: '📊' },
    { id: 'line', name: 'Line Chart', description: 'แสดงแนวโน้มการอัปโหลดตามเวลา', icon: '📈' },
    { id: 'scatter', name: 'Scatter Plot', description: 'วิเคราะห์ความสัมพันธ์ระหว่างตัวแปร', icon: '🔹' },
    { id: 'heatmap', name: 'Heat Map', description: 'แสดงความหนาแน่นของข้อมูล', icon: '🔥' }
  ];

  const getRecommendedChart = (description) => {
    const lower = description.toLowerCase();
    if (lower.includes('สัดส่วน') || lower.includes('เปอร์เซ็นต์')) return 'pie';
    if (lower.includes('เปรียบเทียบ') || lower.includes('compare')) return 'bar';
    if (lower.includes('เวลา') || lower.includes('แนวโน้ม') || lower.includes('trend')) return 'line';
    if (lower.includes('ความสัมพันธ์') || lower.includes('correlation')) return 'scatter';
    return 'bar';
  };

  const recommended = reportDescription ? getRecommendedChart(reportDescription) : null;

  return (
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
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            สร้างรายงานและกราฟ
          </h2>
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
            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อธิบายสิ่งที่ต้องการวิเคราะห์
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows="3"
                placeholder="เช่น อยากเห็นสัดส่วนประเภทเอกสาร, เปรียบเทียบจำนวนไฟล์แต่ละเดือน, แนวโน้มการอัปโหลด..."
              />
            </div>

            {/* Recommendation */}
            {recommended && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 แนะนำกราฟที่เหมาะสม:</h4>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{chartTypes.find(c => c.id === recommended)?.icon}</span>
                  <div>
                    <p className="font-medium text-blue-700">{chartTypes.find(c => c.id === recommended)?.name}</p>
                    <p className="text-sm text-blue-600">{chartTypes.find(c => c.id === recommended)?.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                เลือกประเภทกราฟ
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartTypes.map((chart) => (
                  <div
                    key={chart.id}
                    onClick={() => setReportType(chart.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      reportType === chart.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : recommended === chart.id
                          ? 'border-blue-300 bg-blue-50 hover:border-green-400'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl flex-shrink-0">{chart.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800">{chart.name}</h4>
                        <p className="text-sm text-gray-600 break-words">{chart.description}</p>
                        {recommended === chart.id && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full mt-1 inline-block">
                            แนะนำ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                alert(`กำลังสร้างรายงาน ${chartTypes.find(c => c.id === reportType)?.name || 'แบบกำหนดเอง'}`);
                onClose();
                setReportType('');
                setReportDescription('');
              }}
              disabled={!reportType}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                !reportType
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105'
              }`}
            >
              สร้างรายงาน
            </button>
            <button
              onClick={() => {
                onClose();
                setReportType('');
                setReportDescription('');
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
