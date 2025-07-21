// src/services/ApiService.js - Original version without layout detection
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

  // ✅ Upload multiple files with parsed company_name and pn_name support
  static async uploadFiles(filesWithParsedData, workDetail = '') {
    try {
      if (!filesWithParsedData || filesWithParsedData.length === 0) {
        throw new Error('No files selected for upload');
      }

      console.log(`📤 Uploading ${filesWithParsedData.length} files with parsed data...`);

      const formData = new FormData();
      
      // Handle different input formats
      if (Array.isArray(filesWithParsedData) && filesWithParsedData[0]?.file) {
        // New format with parsed data: [{ file, company_name, pn_name, work_detail }]
        console.log('🔄 Processing files with parsed data format...');
        
        filesWithParsedData.forEach((fileData, index) => {
          const file = fileData.file;
          
          console.log(`📋 Processing file ${index + 1}:`, {
            name: file?.name || 'undefined',
            type: file?.type || 'undefined',
            size: file?.size || 'undefined',
            company: fileData.company_name,
            pn: fileData.pn_name
          });
          
          // Validate file before upload
          this.validateFile(file);
          
          // Add file to FormData
          formData.append('files', file);
          
          // Add parsed data for each file
          formData.append(`company_name_${index}`, fileData.company_name || '');
          formData.append(`pn_name_${index}`, fileData.pn_name || '');
          
          console.log(`📎 Added file ${index}: ${file.name}`);
          console.log(`🏢 Company: ${fileData.company_name}`);
          console.log(`🔖 P/N: ${fileData.pn_name}`);
        });
        
        // Add work detail from parameter or first file's work_detail
        const workDetailToUse = workDetail || filesWithParsedData[0]?.work_detail || '';
        if (workDetailToUse.trim()) {
          formData.append('workDetail', workDetailToUse.trim());
        }
        
      } else {
        // Legacy format: direct file array (for backward compatibility)
        console.log('🔄 Processing files in legacy format...');
        const files = Array.isArray(filesWithParsedData) ? filesWithParsedData : [filesWithParsedData];
        
        // Validate files before upload
        this.validateFiles(files);

        files.forEach((file, index) => {
          console.log(`📋 Processing legacy file ${index + 1}:`, {
            name: file?.name || 'undefined',
            type: file?.type || 'undefined',
            size: file?.size || 'undefined'
          });
          
          formData.append('files', file);
          
          // Extract company_name and pn_name if available in file object
          if (file.company_name !== undefined) {
            formData.append(`company_name_${index}`, file.company_name || '');
          }
          if (file.pn_name !== undefined) {
            formData.append(`pn_name_${index}`, file.pn_name || '');
          }
          
          console.log(`📎 Added file ${index}: ${file.name} (${file.size} bytes)`);
        });

        // Add work detail if provided
        if (workDetail && workDetail.trim()) {
          formData.append('workDetail', workDetail.trim());
        }
      }

      // Add metadata about the parsing
      formData.append('hasParsedData', 'true');
      formData.append('uploadTimestamp', new Date().toISOString());

      console.log('🚀 Sending files to server...');

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

      console.log(`✅ Upload successful: ${result.data.length} files uploaded with parsed data`);
      return result;

    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  // ✅ Get all files with pagination and search by company/pn
  static async getFiles(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    
    // Add search parameters for company_name and pn_name
    if (params.company_name) queryParams.append('company_name', params.company_name);
    if (params.pn_name) queryParams.append('pn_name', params.pn_name);
    if (params.search) queryParams.append('search', params.search);

    const endpoint = queryParams.toString() ? `/files?${queryParams}` : '/files';
    return this.request(endpoint);
  }

  // ✅ Search files by company name
  static async searchByCompany(companyName, params = {}) {
    return this.getFiles({
      ...params,
      company_name: companyName
    });
  }

  // ✅ Search files by P/N
  static async searchByPN(pnName, params = {}) {
    return this.getFiles({
      ...params,
      pn_name: pnName
    });
  }

  // ✅ Get file by ID with full details
  static async getFileById(id) {
    return this.request(`/files/${id}`);
  }

  // ✅ Get file statistics (enhanced with company/pn stats)
  static async getFileStatistics() {
    return this.request('/files/statistics');
  }

  // ✅ Get company statistics
  static async getCompanyStatistics() {
    return this.request('/files/statistics/companies');
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

  // ✅ Validate file before upload - Enhanced with null safety
  static validateFile(file) {
    // Check if file object exists and has required properties
    if (!file) {
      throw new Error('File object is missing');
    }

    if (!file.name) {
      throw new Error('File name is missing');
    }

    if (!file.type) {
      throw new Error(`File "${file.name}" has missing type information`);
    }

    if (typeof file.size !== 'number') {
      throw new Error(`File "${file.name}" has invalid size information`);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" is too large. Maximum size is 50MB.`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File "${file.name}" has unsupported type "${file.type}". Only PDF, JPG, PNG files are allowed.`);
    }

    console.log(`✅ File validation passed: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`);
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