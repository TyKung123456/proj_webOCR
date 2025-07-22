// src/routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  upload,
  uploadFiles,
  getAllFiles,
  getFileById,
  viewFile,
  downloadFile,
  deleteFile,
  getFileStatistics
} = require('../controllers/fileController');

// ✅ Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'File API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ File upload endpoint (supports multiple files) - Increased to 200 files
router.post('/files/upload', upload.array('files', 200), uploadFiles);

// ✅ Get all files with pagination and filtering
router.get('/files', getAllFiles);

// ✅ Get file statistics
router.get('/files/statistics', getFileStatistics);

// ✅ Get file by ID
router.get('/files/:id', getFileById);

// ✅ View file content (for preview) - Important for PDF viewing
router.get('/files/:id/view', viewFile);

// ✅ Download file
router.get('/files/:id/download', downloadFile);

// ✅ Delete file
router.delete('/files/:id', deleteFile);

// ✅ Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 200 files per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "files" as field name.'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});


// ✅ FIX: Export the router directly
module.exports = router;