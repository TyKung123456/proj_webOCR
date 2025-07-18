// src/config/config.js - Frontend Configuration

const config = {
  // --- API Configuration ---
  API_BASE_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api' // Development API URL
    : 'https://your-production-api.com/api', // TODO: Change to your production URL

  // --- File Upload Settings ---
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
  MAX_FILES_PER_UPLOAD: 10,

  // --- App Information ---
  APP_NAME: 'File Upload System',
  VERSION: '1.0.0',

  // --- Environment ---
  isDevelopment: window.location.hostname === 'localhost',

  // --- Theme & Dark Mode Settings ---
  THEME_SETTINGS: {
    DEFAULT_THEME: 'system', // ค่าเริ่มต้นสามารถเป็น 'light', 'dark', หรือ 'system'
    STORAGE_KEY: 'darkMode', // Key ที่ใช้สำหรับเก็บค่าใน localStorage
  },

  // --- English Error Messages ---
  ERROR_MESSAGES: {
    UPLOAD_FAILED: 'File upload failed.',
    DELETE_FAILED: 'File deletion failed.',
    FETCH_FAILED: 'Failed to fetch data.',
    NETWORK_ERROR: 'A network error occurred. Please check your connection.',
    FILE_TOO_LARGE: 'The file is too large.',
    INVALID_FILE_TYPE: 'The file type is not allowed.',
    NO_FILES_SELECTED: 'Please select a file to upload.'
  }
};

export default config;
