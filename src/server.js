// src/server.js - Refined with Thai Language Support
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// NOTE: Setting NODE_OPTIONS should ideally be done in your start script (e.g., in package.json)
// "start": "NODE_OPTIONS='--max_old_space_size=4096' node src/server.js"
// rather than in the code itself.

const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔄 Starting File Upload API Server with Thai Support...');

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// ✅ CORS Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'Accept-Charset'],
  optionsSuccessStatus: 200
}));

// ✅ Body parsing middleware (UTF-8 is handled by default)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 50000
}));

// [REMOVED] Redundant middleware that incorrectly set Content-Type for all routes.
// express.json() and res.json() handle this correctly for API routes.

// ✅ Static file serving for uploads with Thai filename support
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // [FIXED] Keep the modern CSP header which is correct for allowing iframes.
    // Removed invalid 'X-Frame-Options: ALLOWALL' and unnecessary charset appending.
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
    }

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache

    // ✅ Handle Thai filenames for download prompts
    const filename = path.basename(filePath);
    if (/[\u0E00-\u0E7F]/.test(filename)) { // Check if contains Thai characters
      const encodedFilename = encodeURIComponent(filename);
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
    }
  }
}));

// ✅ API Routes
app.use('/api', fileRoutes);

// ✅ Root endpoint
app.get('/', (req, res) => {
  // res.json() correctly sets Content-Type to application/json; charset=utf-8
  res.json({
    success: true,
    message: 'File Upload API Server with Thai Language Support',
    version: '2.0.0',
    encoding: 'UTF-8',
    thai_support: true,
    endpoints: {
      health: '/api/health',
      upload: 'POST /api/files/upload',
      files: 'GET /api/files',
      file_detail: 'GET /api/files/:id',
      file_view: 'GET /api/files/:id/view',
      file_download: 'GET /api/files/:id/download',
      file_delete: 'DELETE /api/files/:id',
      statistics: 'GET /api/files/statistics'
    },
    features: {
      thai_characters: 'Supported ✅',
      unicode_filenames: 'Supported ✅',
      utf8_content: 'Supported ✅',
      thai_ocr: 'Ready for integration ✅'
    }
  });
});

// ✅ Health check with Thai test
app.get('/api/health/thai', (req, res) => {
  res.json({
    success: true,
    message: 'Thai language support test',
    thai_text: 'สวัสดีครับ ระบบรองรับภาษาไทยแล้ว! 🇹🇭',
    encoding: 'UTF-8',
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large / ขนาดไฟล์ใหญ่เกินไป'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error / เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log('================================');
  console.log('🚀 File Upload API Server Started!');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🇹🇭 Thai Test: http://localhost:${PORT}/api/health/thai`);
  console.log(`📁 File Uploads: http://localhost:${PORT}/uploads`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'n8n'}`);
  console.log(`🌏 Encoding: UTF-8 (Thai Support Enabled)`);
  console.log('================================');
});

// ✅ Process handlers for graceful shutdown and