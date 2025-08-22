// src/components/modals/UploadModal.jsx - Fixed scrolling issue completely + File name parsing
import React, { useState } from 'react';
import ApiService from '../../services/ApiService.js';

const UploadModal = ({ onClose, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [workDetail, setWorkDetail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  // ✅ Parse file name to extract company_name and pn_name
  // การอ่านชื่อไฟล์จากซ้ายไปขวา: ชื่อบริษัท_เลขP/N_เอกสาร
  const parseFileName = (fileName) => {
    console.log(`🔍 Parsing filename: "${fileName}"`);

    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    console.log(`📝 Name without extension: "${nameWithoutExt}"`);

    // Find first underscore (from left to right)
    const firstUnderscoreIndex = nameWithoutExt.indexOf('_');
    console.log(`📍 First underscore position: ${firstUnderscoreIndex}`);

    if (firstUnderscoreIndex === -1) {
      // No underscore found, return original name as company_name and empty pn_name
      console.log(`⚠️ No underscore found, using entire name as company_name`);
      return {
        company_name: nameWithoutExt,
        pn_name: '',
        parsing_note: 'No underscore found - entire name used as company name'
      };
    }

    if (firstUnderscoreIndex === 0) {
      // Underscore at the beginning, invalid format
      console.log(`⚠️ Invalid format: underscore at beginning`);
      return {
        company_name: nameWithoutExt,
        pn_name: '',
        parsing_note: 'Invalid format - underscore at beginning'
      };
    }

    // Split by first underscore (reading from left to right)
    const company_name = nameWithoutExt.substring(0, firstUnderscoreIndex);
    const pn_name = nameWithoutExt.substring(firstUnderscoreIndex + 1);

    console.log(`🏢 Company name: "${company_name}"`);
    console.log(`🔖 P/N name: "${pn_name}"`);

    // Validate extracted data
    if (!company_name.trim()) {
      return {
        company_name: nameWithoutExt,
        pn_name: '',
        parsing_note: 'Empty company name - using entire filename'
      };
    }

    return {
      company_name: company_name.trim(),
      pn_name: pn_name.trim(),
      parsing_note: `Parsed successfully: Company "${company_name.trim()}" + P/N "${pn_name.trim()}"`
    };
  };

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

  // ✅ Add files with validation and file name parsing
  const addFiles = (newFiles) => {
    const validFiles = [];
    const newErrors = [];

    console.log('📁 Adding new files:', newFiles);

    newFiles.forEach((file, index) => {
      try {
        console.log(`🔍 Processing file ${index}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          isFile: file instanceof File
        });

        // Validate file
        ApiService.validateFile(file);

        // Check for duplicates
        const isDuplicate = selectedFiles.some(existing =>
          existing.name === file.name && existing.size === file.size
        );

        if (isDuplicate) {
          newErrors.push(`File "${file.name}" is already selected`);
        } else {
          // Parse file name to extract company_name and pn_name
          const { company_name, pn_name, parsing_note } = parseFileName(file.name);

          // Create a new File object with additional properties
          // Note: We can't directly modify File object, so we create a wrapper
          const enhancedFile = Object.assign(file, {
            company_name,
            pn_name,
            parsing_note,
            parsed_name: {
              company_name,
              pn_name,
              parsing_note
            }
          });

          console.log(`✅ Enhanced file ${index}:`, {
            name: enhancedFile.name,
            company_name: enhancedFile.company_name,
            pn_name: enhancedFile.pn_name,
            isFile: enhancedFile instanceof File
          });

          validFiles.push(enhancedFile);

          console.log(`📝 Parsed file "${file.name}":`, {
            company_name,
            pn_name,
            parsing_note
          });
        }
      } catch (error) {
        console.error(`❌ Error processing file ${index}:`, error);
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

    console.log(`📊 Files added: ${validFiles.length} valid, ${newErrors.length} errors`);
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
      console.log('📂 Selected files before processing:', selectedFiles);

      // Debug: Check each file's properties
      selectedFiles.forEach((file, index) => {
        console.log(`🔍 File ${index} debug:`, {
          file: file,
          name: file?.name,
          type: file?.type,
          size: file?.size,
          company_name: file?.company_name,
          pn_name: file?.pn_name,
          isFileInstance: file instanceof File
        });
      });

      // Prepare files with parsed data in the correct format
      const filesWithParsedData = selectedFiles.map((file, index) => {
        // Ensure we have a valid File object
        if (!(file instanceof File)) {
          console.error(`❌ File ${index} is not a File instance:`, file);
          throw new Error(`File ${index} is not a valid File object`);
        }

        if (!file.name) {
          console.error(`❌ File ${index} has no name:`, file);
          throw new Error(`File ${index} has no name property`);
        }

        return {
          file: file, // The actual File object
          company_name: file.company_name || '',
          pn_name: file.pn_name || '',
          work_detail: workDetail
        };
      });

      console.log('📋 Files prepared for upload:', filesWithParsedData.map(f => ({
        name: f.file.name,
        type: f.file.type,
        size: f.file.size,
        company: f.company_name,
        pn: f.pn_name
      })));

      // Upload files using ApiService
      const result = await ApiService.uploadFiles(filesWithParsedData, workDetail);

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

  // ✅ Get file preview - Fixed null safety
  const getFilePreview = (file) => {
    if (file && file.type && file.type.startsWith('image/')) {
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

            {/* File Name Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium mb-2">📋 File Name Format (อ่านจากซ้ายไปขวา):</h4>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700">
                  <strong>รูปแบบ:</strong> <code className="bg-blue-100 px-2 py-1 rounded">ชื่อบริษัท_เลขP/N_เอกสาร.pdf</code>
                </p>
                <div className="text-blue-600 text-xs space-y-1">
                  <p><strong>ตัวอย่าง:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>"Apple_iPhone15_Manual.pdf" → บริษัท: "Apple", P/N: "iPhone15_Manual"</li>
                    <li>"Samsung_Galaxy_S24_Specification.pdf" → บริษัท: "Samsung", P/N: "Galaxy_S24_Specification"</li>
                    <li>"Microsoft_Surface_Pro_9_UserGuide.pdf" → บริษัท: "Microsoft", P/N: "Surface_Pro_9_UserGuide"</li>
                  </ul>
                  <p className="text-orange-600 mt-2">
                    <strong>หมายเหตุ:</strong> ใช้เครื่องหมาย _ (underscore) ตัวแรกเป็นตัวแบ่งเท่านั้น
                  </p>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${isDragOver
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
                                {(file.type && file.type.includes('pdf')) ? '📄' : '📁'}
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
                              <span>{file.type || 'Unknown'}</span>
                              <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                            </div>
                            {/* Show parsed data */}
                            <div className="mt-1 text-xs">
                              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                                🏢 {file.company_name || 'N/A'}
                              </span>
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                🔖 {file.pn_name || 'N/A'}
                              </span>
                              {file.parsing_note && (
                                <div className="mt-1 text-xs text-gray-600 italic">
                                  💡 {file.parsing_note}
                                </div>
                              )}
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
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${selectedFiles.length === 0 || isUploading
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