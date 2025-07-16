// src/config/config.js - Frontend Configuration
const config = {
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : 'https://your-production-api.com/api', // เปลี่ยนเป็น production URL

  // File upload settings
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
  MAX_FILES_PER_UPLOAD: 10,

  // App settings
  APP_NAME: 'File Upload System',
  VERSION: '1.0.0',

  // Development settings
  isDevelopment: window.location.hostname === 'localhost',
  
  // Error messages
  ERROR_MESSAGES: {
    UPLOAD_FAILED: 'การอัปโหลดไฟล์ล้มเหลว',
    DELETE_FAILED: 'การลบไฟล์ล้มเหลว',
    FETCH_FAILED: 'ไม่สามารถดึงข้อมูลได้',
    NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    FILE_TOO_LARGE: 'ไฟล์มีขนาดใหญ่เกินกำหนด',
    INVALID_FILE_TYPE: 'ประเภทไฟล์ไม่ถูกต้อง',
    NO_FILES_SELECTED: 'กรุณาเลือกไฟล์'
  }
};

export default config;