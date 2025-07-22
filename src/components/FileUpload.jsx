import React, { useState, useRef, useEffect } from 'react';

const FileUploadApp = () => {
  // Add Tailwind CSS and custom styles
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      .bg-gradient-to-br {
        background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
      }
      .bg-gradient-to-r {
        background-image: linear-gradient(to right, var(--tw-gradient-stops));
      }
      .from-blue-600 {
        --tw-gradient-from: #2563eb;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(37, 99, 235, 0));
      }
      .to-purple-600 {
        --tw-gradient-to: #9333ea;
      }
      .via-purple-600 {
        --tw-gradient-stops: var(--tw-gradient-from), #9333ea, var(--tw-gradient-to, rgba(147, 51, 234, 0));
      }
      .to-pink-600 {
        --tw-gradient-to: #db2777;
      }
      .from-blue-500 {
        --tw-gradient-from: #3b82f6;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
      }
      .to-blue-600 {
        --tw-gradient-to: #2563eb;
      }
      .from-green-500 {
        --tw-gradient-from: #10b981;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(16, 185, 129, 0));
      }
      .to-green-600 {
        --tw-gradient-to: #059669;
      }
      .from-purple-500 {
        --tw-gradient-from: #8b5cf6;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0));
      }
      .from-orange-500 {
        --tw-gradient-from: #f97316;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 115, 22, 0));
      }
      .to-orange-600 {
        --tw-gradient-to: #ea580c;
      }
      .from-gray-50 {
        --tw-gradient-from: #f9fafb;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 250, 251, 0));
      }
      .via-blue-50 {
        --tw-gradient-stops: var(--tw-gradient-from), #eff6ff, var(--tw-gradient-to, rgba(239, 246, 255, 0));
      }
      .to-purple-50 {
        --tw-gradient-to: #faf5ff;
      }
      .bg-clip-text {
        -webkit-background-clip: text;
        background-clip: text;
      }
      .text-transparent {
        color: transparent;
      }
      .transform {
        transform: var(--tw-transform);
      }
      .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
      }
      .duration-300 {
        transition-duration: 300ms;
      }
      .duration-200 {
        transition-duration: 200ms;
      }
      .hover\\:scale-105:hover {
        --tw-scale-x: 1.05;
        --tw-scale-y: 1.05;
        transform: translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
      }
      .hover\\:scale-110:hover {
        --tw-scale-x: 1.1;
        --tw-scale-y: 1.1;
        transform: translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
      }
      .hover\\:shadow-2xl:hover {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }
      .shadow-2xl {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }
      .shadow-xl {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .shadow-lg {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .focus\\:ring-2:focus {
        box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
      }
      .focus\\:ring-blue-500:focus {
        --tw-ring-color: #3b82f6;
      }
      .focus\\:border-blue-500:focus {
        border-color: #3b82f6;
      }
      .focus\\:ring-purple-500:focus {
        --tw-ring-color: #8b5cf6;
      }
      .focus\\:border-purple-500:focus {
        border-color: #8b5cf6;
      }
      .focus\\:ring-green-500:focus {
        --tw-ring-color: #10b981;
      }
      .focus\\:border-green-500:focus {
        border-color: #10b981;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const [currentPage, setCurrentPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [files, setFiles] = useState([
    {
      id: 1,
      name: 'invoice_001.pdf',
      type: 'Invoice',
      uploadedAt: '2025-07-09 10:30 AM',
      status: 'Processed',
      ocrText: 'บริษัท ABC จำกัด\nใบแจ้งหนี้ เลขที่ INV-2025-001\nวันที่: 9 กรกฎาคม 2025\nรายการ: บริการที่ปรึกษา\nจำนวนเงิน: 50,000 บาท\nภาษีมูลค่าเพิ่ม: 3,500 บาท\nรวม: 53,500 บาท',
      preview: '/api/placeholder/300/400'
    },
    {
      id: 2,
      name: 'contract_002.pdf',
      type: 'Contract',
      uploadedAt: '2025-07-09 11:15 AM',
      status: 'Processed',
      ocrText: 'สัญญาจ้างงาน\nระหว่าง บริษัท XYZ จำกัด\nและ นายสมชาย ใจดี\nระยะเวลา: 1 ปี\nเงินเดือน: 35,000 บาท/เดือน\nเริ่มงาน: 1 สิงหาคม 2025',
      preview: '/api/placeholder/300/400'
    },
    {
      id: 3,
      name: 'receipt_003.pdf',
      type: 'Receipt',
      uploadedAt: '2025-07-09 11:45 AM',
      status: 'Processed',
      ocrText: 'ใบเสร็จรับเงิน\nร้าน ABC Store\nรายการ: อุปกรณ์สำนักงาน\nจำนวน: 2,500 บาท\nวันที่: 8 กรกฎาคม 2025',
      preview: '/api/placeholder/300/400'
    }
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [suspiciousGroups, setSuspiciousGroups] = useState([
    {
      id: 1,
      name: 'ใบเสร็จจำนวนเงินผิดปกติ',
      suspicionLevel: 'high',
      count: 2,
      files: [1, 3],
      description: 'พบใบเสร็จที่มีจำนวนเงินสูงผิดปกติ และมีรูปแบบการออกใบเสร็จที่คล้ายกัน',
      reasons: ['จำนวนเงินสูงกว่าปกติ 300 เปอร์เซ็นต์', 'รูปแบบการออกใบเสร็จเหมือนกัน', 'ออกในวันเดียวกัน']
    },
    {
      id: 2,
      name: 'สัญญาจ้างงานข้อมูลไม่ตรงกัน',
      suspicionLevel: 'medium',
      count: 1,
      files: [2],
      description: 'พบข้อมูลในสัญญาจ้างงานที่ไม่สอดคล้องกับข้อมูลในระบบ',
      reasons: ['เงินเดือนสูงกว่าเกณฑ์ปกติ', 'วันที่เริ่มงานย้อนหลัง']
    }
  ]);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'ai', text: 'สวัสดีครับ ผมสามารถช่วยวิเคราะห์ข้อมูลและตรวจสอบความน่าสงสัยของเอกสารได้ครับ' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [workDetail, setWorkDetail] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [previewBrightness, setPreviewBrightness] = useState(100);
  const [previewContrast, setPreviewContrast] = useState(100);
  const [selectedSuspiciousGroup, setSelectedSuspiciousGroup] = useState(null);
  const fileInput = useRef(null);
  const owners = ['Owner1', 'Owner2', 'Owner3'];

  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }));
  const [currentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  }));

  const triggerFileInput = () => {
    if (fileInput.current) fileInput.current.click();
  };

  const addFiles = (fileList) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const newValidFiles = Array.from(fileList).filter(file => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return validExtensions.includes(extension);
    });

    const existingNames = new Set(selectedFiles.map(f => f.name));
    const uniqueFiles = newValidFiles.filter(file => !existingNames.has(file.name));
    setSelectedFiles(prev => [...prev, ...uniqueFiles]);

    if (fileList.length > newValidFiles.length) {
      alert(`Skipped ${fileList.length - newValidFiles.length} files. Only JPG, JPEG, PNG, PDF are allowed.`);
    }
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0 || !selectedOwner) {
      alert('Please select files and an owner.');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      selectedFiles.forEach(file => {
        const newFile = {
          id: files.length + Math.random(),
          name: file.name,
          type: 'Unknown',
          uploadedAt: new Date().toLocaleString('th-TH'),
          status: 'Processed',
          ocrText: 'OCR processing completed',
          preview: URL.createObjectURL(file)
        };
        setFiles(prev => [...prev, newFile]);
      });

      cancelUpload();
      alert('Files uploaded successfully!');
    } catch (error) {
      alert('Upload failed!');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setSelectedFiles([]);
    setSelectedOwner('');
    setWorkDetail('');
    setIsDragOver(false);
  };

  const deleteFile = (fileId) => {
    if (window.confirm(`Are you sure you want to file ID ${fileId}?`)) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      alert('File deleted successfully!');
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      text: inputMessage
    };

    setChatMessages(prev => [...prev, newMessage]);

    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: 'ai',
        text: 'ได้รับข้อความแล้วครับ! ให้ผมช่วยตรวจสอบความน่าสงสัยหรือวิเคราะห์ข้อมูลอะไรดีครับ?',
        chart: inputMessage.toLowerCase().includes('กราฟ') || inputMessage.toLowerCase().includes('chart')
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInputMessage('');
  };

  const DocumentTypeChart = () => {
    const data = [
      { type: 'Invoice', count: files.filter(f => f.type === 'Invoice').length, color: '#3b82f6' },
      { type: 'Contract', count: files.filter(f => f.type === 'Contract').length, color: '#10b981' },
      { type: 'Receipt', count: files.filter(f => f.type === 'Receipt').length, color: '#f59e0b' },
      { type: 'Other', count: files.filter(f => f.type === 'Unknown').length, color: '#ef4444' }
    ].filter(d => d.count > 0);

    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 rounded-full relative overflow-hidden mb-4 bg-gray-100">
          {data.map((item, index) => {
            const percentage = (item.count / total) * 100;
            const cumulativePercentage = data.slice(0, index).reduce((sum, d) => sum + (d.count / total) * 100, 0);
            const startAngle = (cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2;
            const endAngle = ((cumulativePercentage + percentage) / 100) * 2 * Math.PI - Math.PI / 2;

            return (
              <div
                key={item.type}
                className="absolute inset-0"
                style={{
                  backgroundColor: item.color,
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + Math.cos(startAngle) * 50}% ${50 + Math.sin(startAngle) * 50}%, ${50 + Math.cos(endAngle) * 50}% ${50 + Math.sin(endAngle) * 50}%)`
                }}
              />
            );
          })}
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

  const TimelineChart = () => {
    const data = [
      { time: '10:00', count: 0 },
      { time: '10:30', count: 1 },
      { time: '11:00', count: 1 },
      { time: '11:30', count: 2 },
      { time: '12:00', count: 3 }
    ];

    const maxCount = Math.max(...data.map(d => d.count));

    return (
      <div className="p-4">
        <div className="flex items-end justify-between h-40 border-b border-l border-gray-300">
          {data.map((item, index) => (
            <div key={item.time} className="flex flex-col items-center flex-1">
              <div
                className="bg-blue-500 w-8 transition-all duration-300 hover:bg-blue-600 rounded-t"
                style={{ height: `${(item.count / maxCount) * 120}px` }}
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

  const HomePage = () => (
    <div className="space-y-6">
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
              <h3 className="text-3xl font-bold text-gray-800">{files.filter(f => f.uploadedAt.includes('2025-07-09')).length}</h3>
              <p className="text-gray-600">Today's Files</p>
            </div>
            <div className="text-4xl text-green-500">📅</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{files.filter(f => f.status === 'Processing').length}</h3>
              <p className="text-gray-600">Pending</p>
            </div>
            <div className="text-4xl text-yellow-500">⏳</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{files.filter(f => f.status === 'Processed').length}</h3>
              <p className="text-gray-600">OCR Processed</p>
            </div>
            <div className="text-4xl text-purple-500">👁</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4">
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
        </div>
      </div>

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
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.uploadedAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${file.status === 'Processed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                        title="View"
                      >
                        👁
                      </button>
                      <button
                        onClick={() => alert('Download feature')}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const GroupsPage = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
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
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${group.suspicionLevel === 'high' ? 'border-red-500' :
                  group.suspicionLevel === 'medium' ? 'border-yellow-500' : 'border-orange-500'
                }`}
              onClick={() => setSelectedSuspiciousGroup(group)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`text-3xl ${group.suspicionLevel === 'high' ? 'text-red-500' :
                      group.suspicionLevel === 'medium' ? 'text-yellow-500' : 'text-orange-500'
                    }`}>
                    {group.suspicionLevel === 'high' ? '🚨' : group.suspicionLevel === 'medium' ? '⚠️' : '🔍'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{group.name}</h3>
                    <p className={`text-sm font-medium ${group.suspicionLevel === 'high' ? 'text-red-600' :
                        group.suspicionLevel === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                      Anomaly Level: {group.suspicionLevel === 'high' ? 'High' : group.suspicionLevel === 'medium' ? 'Medium' : 'Low'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${group.suspicionLevel === 'high' ? 'bg-red-100 text-red-800' :
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

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {group.files.map(fileId => {
                    const file = files.find(f => f.id === fileId);
                    return (
                      <div key={fileId} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
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
  );

  const DashboardPage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 text-lg">Comprehensive insights into your document management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{files.length}</h3>
              <p className="text-blue-100">Total Documents</p>
            </div>
            <div className="text-5xl opacity-80">📊</div>
          </div>
          <div className="mt-4 text-sm text-blue-100">
            ↗️ +12% from last month
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{Math.round((files.filter(f => f.status === 'Processed').length / files.length) * 100)}%</h3>
              <p className="text-green-100">Success Rate</p>
            </div>
            <div className="text-5xl opacity-80">✅</div>
          </div>
          <div className="mt-4 text-sm text-green-100">
            ↗️ +5% from last week
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{suspiciousGroups.length}</h3>
              <p className="text-purple-100">Suspicious Groups</p>
            </div>
            <div className="text-5xl opacity-80">🚨</div>
          </div>
          <div className="mt-4 text-sm text-purple-100">
            ↗️ +2 new alerts
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold">{files.filter(f => f.uploadedAt.includes('2025-07-09')).length}</h3>
              <p className="text-orange-100">Today's Files</p>
            </div>
            <div className="text-5xl opacity-80">⚡</div>
          </div>
          <div className="mt-4 text-sm text-orange-100">
            📈 Peak time: 11:30 AM
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Recent Activity</h3>
          <div className="text-3xl">🕒</div>
        </div>
        <div className="space-y-4">
          {files.slice(0, 5).map((file) => (
            <div key={file.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm">{file.uploadedAt}</p>
              </div>
              <span className="text-2xl">📄</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const FileDetailModal = ({ file, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full h-full max-w-none max-h-none overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {file.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <span className="text-xl text-gray-500">✕</span>
          </button>
        </div>
        <div className="flex" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="w-2/3 p-6 border-r border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Document Preview</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Brightness:</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={previewBrightness}
                    onChange={(e) => setPreviewBrightness(e.target.value)}
                    className="w-24"
                  />
                  <input
                    type="number"
                    min="50"
                    max="150"
                    value={previewBrightness}
                    onChange={(e) => setPreviewBrightness(e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Contrast:</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={previewContrast}
                    onChange={(e) => setPreviewContrast(e.target.value)}
                    className="w-24"
                  />
                  <input
                    type="number"
                    min="50"
                    max="150"
                    value={previewContrast}
                    onChange={(e) => setPreviewContrast(e.target.value)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
            <div
              className="bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                height: 'calc(100vh - 240px)',
                filter: `brightness(${previewBrightness}%) contrast(${previewContrast}%)`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-20"></div>
              <div className="text-center relative z-10">
                <span className="text-6xl mb-4 block text-white opacity-80">📄</span>
                <p className="text-white opacity-60">{file.name}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 opacity-30">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-2 bg-white rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="w-1/3 p-6">
            <h3 className="font-semibold mb-4 text-gray-800">OCR Text Content</h3>
            <div
              className="bg-gray-50 rounded-xl p-4 overflow-y-auto"
              style={{ height: 'calc(100vh - 240px)' }}
            >
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{file.ocrText}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Upload Files
          </h2>
          <button
            onClick={cancelUpload}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <span className="text-xl text-gray-500">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <div className="space-y-4 cursor-pointer">
              <div className="text-6xl text-gray-400">📁</div>
              <div>
                <p className="text-xl font-medium text-gray-700">
                  Drop files here or click to select
                </p>
                <p className="text-gray-500 mt-2">
                  Supports JPG, JPEG, PNG, PDF files
                </p>
              </div>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200">
                Select Files
              </button>
            </div>
          </div>

          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Owner
            </label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an owner...</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Detail (Optional)
            </label>
            <textarea
              value={workDetail}
              onChange={(e) => setWorkDetail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Describe the work or project..."
            />
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length})</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">({formatFileSize(file.size)})</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      <span>✕</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || !selectedOwner || isProcessing}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${selectedFiles.length === 0 || !selectedOwner || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
              )}
            </button>
            <button
              onClick={cancelUpload}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ChatModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Assistant - การตรวจสอบเอกสาร
          </h2>
          <button
            onClick={() => setShowChatModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <span className="text-xl text-gray-500">✕</span>
          </button>
        </div>

        <div className="h-96 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.type === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    <p className="text-sm">{message.text}</p>
                    {message.chart && (
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <DocumentTypeChart />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="ถามเกี่ยวกับการตรวจสอบเอกสารหรือความน่าสงสัย..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
              >
                <span>Send</span>
                <span>➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ReportModal = () => {
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              สร้างรายงานและกราฟ
            </h2>
            <button
              onClick={() => setShowReportModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="text-xl text-gray-500">✕</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อธิบายสิ่งที่ต้องการวิเคราะห์
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows="3"
                placeholder="เช่น อยากเห็นสัดส่วนประเภทเอกสาร, เปรียบเทียบจำนวนไฟล์แต่ละเดือน, แนวโน้มการอัปโหลด..."
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                เลือกประเภทกราฟ
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartTypes.map((chart) => (
                  <div
                    key={chart.id}
                    onClick={() => setReportType(chart.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${reportType === chart.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : recommended === chart.id
                          ? 'border-blue-300 bg-blue-50 hover:border-green-400'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{chart.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-800">{chart.name}</h4>
                        <p className="text-sm text-gray-600">{chart.description}</p>
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

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  alert(`กำลังสร้างรายงาน ${chartTypes.find(c => c.id === reportType)?.name || 'แบบกำหนดเอง'}`);
                  setShowReportModal(false);
                  setReportType('');
                  setReportDescription('');
                }}
                disabled={!reportType}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${!reportType
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105'
                  }`}
              >
                สร้างรายงาน
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
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

  const SuspiciousGroupDetailModal = ({ group, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`text-3xl ${group.suspicionLevel === 'high' ? 'text-red-500' :
                group.suspicionLevel === 'medium' ? 'text-yellow-500' : 'text-orange-500'
              }`}>
              {group.suspicionLevel === 'high' ? '🚨' : group.suspicionLevel === 'medium' ? '⚠️' : '🔍'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <span className="text-xl text-gray-500">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${group.suspicionLevel === 'high' ? 'bg-red-50 border-red-200' :
              group.suspicionLevel === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200'
            }`}>
            <h3 className="font-semibold text-gray-800 mb-2">Anomaly Details</h3>
            <p className="text-gray-700 mb-4">{group.description}</p>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Detected by System:</h4>
              <ul className="space-y-2">
                {group.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className={`mt-1 ${group.suspicionLevel === 'high' ? 'text-red-500' :
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

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Related Documents ({group.count} Files)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.files.map(fileId => {
                const file = files.find(f => f.id === fileId);
                return (
                  <div key={fileId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{file?.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">อัปโหลด: {file?.uploadedAt}</p>
                        <p className="text-sm text-gray-600">ประเภท: {file?.type}</p>

                        <div className="mt-3 bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-700 font-medium mb-1">ตัวอย่างข้อความ OCR:</p>
                          <p className="text-xs text-gray-600 line-clamp-3">
                            {file?.ocrText.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedFile(file);
                          onClose();
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:flex lg:flex-col ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
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
                className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 ${currentPage === 'home'
                  ? 'bg-blue-100 text-blue-600 shadow-md'
                  : 'hover:bg-gray-100 text-gray-700'
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
                className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 ${currentPage === 'groups'
                  ? 'bg-red-100 text-red-600 shadow-md'
                  : 'hover:bg-gray-100 text-gray-700'
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
                className={`w-full flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 ${currentPage === 'dashboard'
                  ? 'bg-blue-100 text-blue-600 shadow-md'
                  : 'hover:bg-gray-100 text-gray-700'
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
              <h1 className="text-2xl font-bold text-gray-900">
                {currentPage === 'home' && 'Customer File Dashboard'}
                {currentPage === 'groups' && 'Anomaly Detection'}
                {currentPage === 'dashboard' && 'Analytics Dashboard'}
              </h1>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{currentDate}</div>
              <div className="text-sm text-gray-600">{currentTime}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'groups' && <GroupsPage />}
          {currentPage === 'dashboard' && <DashboardPage />}
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

      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {selectedSuspiciousGroup && (
        <SuspiciousGroupDetailModal
          group={selectedSuspiciousGroup}
          onClose={() => setSelectedSuspiciousGroup(null)}
        />
      )}

      {showUploadModal && <UploadModal />}
      {showChatModal && <ChatModal />}
      {showReportModal && <ReportModal />}
    </div>
  );
};

export default FileUploadApp;