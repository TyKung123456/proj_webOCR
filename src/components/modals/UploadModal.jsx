// src/components/modals/UploadModal.jsx - Fixed scrolling issue completely
import React, { useState } from 'react';
import ApiService from '../../services/ApiService.js';

const UploadModal = ({ onClose, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [workDetail, setWorkDetail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  // ✅ File input handler
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addFiles(files);
  };

  // ✅ Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  // ✅ Add files with validation
  const addFiles = (newFiles) => {
    const validFiles = [];
    const newErrors = [];

    newFiles.forEach(file => {
      try {
        // Validate file
        ApiService.validateFile(file);
        
        // Check for duplicates
        const isDuplicate = selectedFiles.some(existing => 
          existing.name === file.name && existing.size === file.size
        );

        if (isDuplicate) {
          newErrors.push(`File "${file.name}" is already selected`);
        } else {
          validFiles.push(file);
        }
      } catch (error) {
        newErrors.push(error.message);
      }
    });

    // Update state
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setErrors(newErrors);

    // Clear errors after 5 seconds
    if (newErrors.length > 0) {
      setTimeout(() => setErrors([]), 5000);
    }
  };

  // ✅ Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Upload files to backend
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrors(['Please select at least one file']);
      return;
    }

    try {
      setIsUploading(true);
      setErrors([]);

      console.log('🚀 Starting upload process...');

      // Upload files using ApiService
      const result = await ApiService.uploadFiles(selectedFiles, workDetail);

      console.log('✅ Upload completed:', result);

      // Show success message
      alert(`Successfully uploaded ${result.data.length} file(s)!`);

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(result.data);
      }

      // Reset form
      setSelectedFiles([]);
      setWorkDetail('');
      onClose();

    } catch (error) {
      console.error('❌ Upload failed:', error);
      setErrors([error.message || 'Upload failed. Please try again.']);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Get file preview
  const getFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl" style={{ maxHeight: '90vh', height: 'auto' }}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📤 Upload Files
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled={isUploading}
          >
            <span className="text-xl text-gray-500">✕</span>
          </button>
        </div>

        {/* Content - Scrollable Area */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          <div className="p-6 space-y-6">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-medium mb-2">⚠️ Upload Errors:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="space-y-4">
                <div className="text-6xl">{isDragOver ? '📥' : '📁'}</div>
                <div>
                  <p className="text-xl font-medium text-gray-700">
                    {isDragOver ? 'Drop files here!' : 'Drop files here or click to select'}
                  </p>
                  <p className="text-gray-500 mt-2">
                    Supports PDF, JPG, PNG files (Max 50MB each, 200 files total)
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Select Files'}
                </button>
              </div>
            </div>

            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {/* Work Detail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Work Detail (Optional)
              </label>
              <textarea
                value={workDetail}
                onChange={(e) => setWorkDetail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
                placeholder="Describe the purpose or project for these files..."
                disabled={isUploading}
              />
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-4">
                  📎 Selected Files ({selectedFiles.length}/200)
                </h4>
                <div className="border border-gray-200 rounded-lg">
                  {/* File List Container - Internal Scrollable */}
                  <div className="max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => {
                      const preview = getFilePreview(file);
                      return (
                        <div key={index} className="flex items-center space-x-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          {/* File Preview */}
                          <div className="flex-shrink-0">
                            {preview ? (
                              <img
                                src={preview}
                                alt={file.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                                {file.type.includes('pdf') ? '📄' : '📁'}
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{Math.round(file.size / 1024)} KB</span>
                              <span>{file.type}</span>
                              <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                            className="flex-shrink-0 text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            title="Remove file"
                            disabled={isUploading}
                          >
                            <span className="text-lg">🗑️</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upload Summary */}
                  <div className="p-4 bg-blue-50 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">
                        📊 Total: {selectedFiles.length} files
                      </span>
                      <span className="text-blue-700">
                        💾 Size: {Math.round(selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024)} KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedFiles.length > 0 
                ? `Ready to upload ${selectedFiles.length} file(s)`
                : 'No files selected'
              }
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isUploading}
              >
                Cancel
              </button>
              
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedFiles.length === 0 || isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>🚀</span>
                    <span>Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;