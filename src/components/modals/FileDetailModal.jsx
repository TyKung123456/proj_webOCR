import React, { useState, useEffect } from 'react';
import ApiService from '../../services/ApiService.js';

const FileDetailModal = ({ file, onClose, onDelete }) => {
  const [fileDetails, setFileDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState('preview');
  const [pdfError, setPdfError] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    if (file?.id) {
      checkServerStatus();
      loadFileDetails();
    }
  }, [file?.id]);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      await ApiService.healthCheck();
      setServerStatus('online');
    } catch (err) {
      setServerStatus('offline');
    }
  };

  const loadFileDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getFileById(file.id);
      setFileDetails(response.data);
    } catch (err) {
      setError(err.message);
      setServerStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await ApiService.downloadFile(file.id, file.original_name || file.filename || file.name);
    } catch (err) {
      alert('Download failed: ' + err.message);
    }
  };

  const handleDelete = async () => {
    const fileName = file.original_name || file.filename || file.name;
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }
    try {
      await ApiService.deleteFile(file.id);
      alert('File deleted successfully!');
      if (onDelete) onDelete(file.id);
      onClose();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const resetImageControls = () => {
    setBrightness(100);
    setContrast(100);
    setZoom(100);
  };

  const retryConnection = async () => {
    setPdfError(false);
    await checkServerStatus();
    if (serverStatus === 'online') {
      const iframe = document.querySelector('#pdf-preview-iframe');
      if (iframe) {
        iframe.src = iframe.src;
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg">Loading file details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold mb-2">Error Loading File</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={onClose} className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const details = fileDetails || file;
  const fileUrl = ApiService.getFileViewUrl(details.id);
  const isPDF = details.mime_type === 'application/pdf' || details.file_type === 'PDF';
  const isImage = details.mime_type?.startsWith('image/') || ['JPG', 'JPEG', 'PNG'].includes(details.file_type);
  const displayName = details.original_name || details.filename || details.name;

  return (
    // ✅ Main backdrop and centering container
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
      {/* ✅ Modal container with new size constraints */}
      <div className="bg-white rounded-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="text-3xl">{ApiService.getFileIcon(details.file_type, details.mime_type)}</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate" title={displayName}>{displayName}</h2>
              <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-500 flex-wrap">
                <span>{details.file_type}</span>
                <span>{ApiService.formatFileSize(details.file_size || 0)}</span>
                <span>{new Date(details.uploaded_at).toLocaleString()}</span>
                <span className={`flex items-center space-x-1 ${serverStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  <span className="text-xs">{serverStatus === 'online' ? 'Online' : 'Offline'}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="hidden sm:flex bg-gray-200 rounded-lg p-1">
              <button onClick={() => setPreviewMode('preview')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${previewMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>🔍 Preview</button>
              <button onClick={() => setPreviewMode('info')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${previewMode === 'info' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>ℹ️ Info</button>
            </div>
            <button onClick={handleDownload} className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors" title="Download"><span className="text-xl">⬇️</span></button>
            <button onClick={handleDelete} className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><span className="text-xl">🗑️</span></button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><span className="text-xl">✕</span></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {previewMode === 'preview' ? (
            <div className="w-full flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                {serverStatus === 'offline' ? (
                  <div className="w-full flex flex-col items-center justify-center text-center p-8">
                    <div className="text-6xl mb-4">🔌</div>
                    <h3 className="text-xl font-semibold mb-2">Server Connection Lost</h3>
                    <button onClick={retryConnection} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">🔄 Retry Connection</button>
                  </div>
                ) : isPDF ? (
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r overflow-auto bg-gray-100">
                      <iframe id="pdf-preview-iframe" src={fileUrl} className="w-full h-full border-0" title={`PDF Preview: ${displayName}`} onError={() => setPdfError(true)} />
                    </div>
                    <div className="w-full md:w-1/2 h-1/2 md:h-full p-4 overflow-auto bg-white">
                      <h3 className="text-lg font-semibold mb-2">📝 OCR Text Content</h3>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border h-full overflow-auto">{details.ocr_text || 'No OCR data available.'}</pre>
                    </div>
                  </div>
                ) : isImage ? (
                  <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4">
                    <img src={fileUrl} alt={displayName} className="max-w-full max-h-full transition-all duration-200" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)`, transform: `scale(${zoom / 100})` }} />
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center text-center p-8">
                    <div className="text-6xl mb-4">{ApiService.getFileIcon(details.file_type, details.mime_type)}</div>
                    <h3 className="text-xl font-semibold mb-2">Preview Not Available</h3>
                    <button onClick={handleDownload} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">Download File</button>
                  </div>
                )}
              </div>
              {isImage && serverStatus === 'online' && (
                <div className="flex-shrink-0 flex items-center justify-center flex-wrap p-2 md:p-4 border-t bg-gray-50 gap-x-4 gap-y-2">
                  <div className="flex items-center space-x-2"><label className="text-sm text-gray-600">Brightness:</label><input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(e.target.value)} className="w-24" /><span className="text-xs text-gray-500 w-8">{brightness}%</span></div>
                  <div className="flex items-center space-x-2"><label className="text-sm text-gray-600">Contrast:</label><input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(e.target.value)} className="w-24" /><span className="text-xs text-gray-500 w-8">{contrast}%</span></div>
                  <div className="flex items-center space-x-2"><label className="text-sm text-gray-600">Zoom:</label><input type="range" min="50" max="200" value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-24" /><span className="text-xs text-gray-500 w-8">{zoom}%</span></div>
                  <button onClick={resetImageControls} className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-gray-700">Reset</button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border"><h3 className="text-lg font-semibold mb-4">📋 File Information</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><label className="font-medium text-gray-700">Original Name:</label><p className="text-gray-900 break-all">{displayName}</p></div><div><label className="font-medium text-gray-700">File Type:</label><p className="text-gray-900">{details.file_type}</p></div><div><label className="font-medium text-gray-700">MIME Type:</label><p className="text-gray-900">{details.mime_type}</p></div><div><label className="font-medium text-gray-700">File Size:</label><p className="text-gray-900">{ApiService.formatFileSize(details.file_size || 0)}</p></div><div><label className="font-medium text-gray-700">Uploaded:</label><p className="text-gray-900">{new Date(details.uploaded_at).toLocaleString()}</p></div></div></div>
                {details.ocr_text && (<div className="bg-white rounded-lg p-6 shadow-sm border"><h3 className="text-lg font-semibold mb-4">👁️ OCR Results</h3><div className="bg-gray-50 rounded border p-4 max-h-64 overflow-y-auto"><pre className="text-sm text-gray-700 whitespace-pre-wrap">{details.ocr_text}</pre></div></div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;