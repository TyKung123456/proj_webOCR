// src/services/ApiService.js - Fixed upload endpoint
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : 'http://localhost:3001/api';

class ApiService {
  // ✅ Generic API request method
  static async request(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      // Remove Content-Type for FormData uploads
      if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      console.log(`✅ API Response: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error('❌ API Request Error:', error);
      throw error;
    }
  }

  // ✅ Upload multiple files with FIXED endpoint
  static async uploadFiles(files, workDetail = '') {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files selected for upload');
      }

      console.log(`📤 Uploading ${files.length} files...`);

      // Validate files before upload
      this.validateFiles(files);

      const formData = new FormData();
      
      // Add files to FormData
      files.forEach(file => {
        formData.append('files', file);
        console.log(`📎 Added file: ${file.name} (${file.size} bytes)`);
      });

      // Add work detail if provided
      if (workDetail && workDetail.trim()) {
        formData.append('workDetail', workDetail.trim());
      }

      // ✅ FIXED: Use correct endpoint /files/upload (not /files/uploads)
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Upload failed: ${response.status}`);
      }

      console.log(`✅ Upload successful: ${result.data.length} files uploaded`);
      return result;

    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  // ✅ Get all files with pagination
  static async getFiles(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);

    const endpoint = queryParams.toString() ? `/files?${queryParams}` : '/files';
    return this.request(endpoint);
  }

  // ✅ Get file by ID with full details
  static async getFileById(id) {
    return this.request(`/files/${id}`);
  }

  // ✅ Get file statistics
  static async getFileStatistics() {
    return this.request('/files/statistics');
  }

  // ✅ Delete file
  static async deleteFile(id) {
    return this.request(`/files/${id}`, {
      method: 'DELETE'
    });
  }

  // ✅ Get file view URL (for PDF preview)
  static getFileViewUrl(id) {
    return `${API_BASE_URL}/files/${id}/view`;
  }

  // ✅ Get file download URL
  static getFileDownloadUrl(id) {
    return `${API_BASE_URL}/files/${id}/download`;
  }

  // ✅ Download file as blob (for programmatic downloads)
  static async downloadFileBlob(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${id}/download`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }

      return response.blob();
    } catch (error) {
      console.error('❌ Download error:', error);
      throw error;
    }
  }

  // ✅ Helper method to trigger file download
  static async downloadFile(id, filename) {
    try {
      console.log(`📥 Downloading file: ${filename}`);
      
      const blob = await this.downloadFileBlob(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Download completed: ${filename}`);
      return true;

    } catch (error) {
      console.error('❌ Download error:', error);
      throw error;
    }
  }

  // ✅ Check if file exists and is accessible
  static async checkFileAccess(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${id}/view`, {
        method: 'HEAD' // Only check headers, don't download content
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ File access check failed:', error);
      return false;
    }
  }

  // ✅ Health check
  static async healthCheck() {
    return this.request('/health');
  }

  // ✅ Format file size helper
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ✅ Get file type icon
  static getFileIcon(fileType, mimeType) {
    const type = fileType?.toLowerCase() || '';
    const mime = mimeType?.toLowerCase() || '';

    if (type === 'pdf' || mime.includes('pdf')) return '📄';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type) || mime.includes('image')) return '🖼️';
    if (['doc', 'docx'].includes(type) || mime.includes('word')) return '📝';
    if (['xls', 'xlsx'].includes(type) || mime.includes('excel')) return '📊';
    if (['zip', 'rar', '7z'].includes(type) || mime.includes('zip')) return '📦';
    return '📁';
  }

  // ✅ Validate file before upload
  static validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" is too large. Maximum size is 50MB.`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File "${file.name}" has unsupported type. Only PDF, JPG, PNG files are allowed.`);
    }

    return true;
  }

  // ✅ Validate multiple files - Updated to support 200 files
  static validateFiles(files) {
    if (!files || files.length === 0) {
      throw new Error('No files selected');
    }

    if (files.length > 200) {
      throw new Error('Too many files. Maximum 200 files per upload.');
    }

    files.forEach(file => this.validateFile(file));
    return true;
  }
}

export default ApiService;