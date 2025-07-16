// src/controllers/fileController.js - FIXED OCR Text Logic
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Helper to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to create safe storage filename
const createSafeStorageFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const uuid = generateUUID();
  return `${uuid}${ext}`;
};

const db = require('../config/database');

// Configure multer with Thai language support
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const uploadDir = path.join(__dirname, '../../uploads', timestamp);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!req.folderTimestamp) {
      req.folderTimestamp = timestamp;
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const safeStorageFilename = createSafeStorageFilename(originalName);
      if (!req.originalFileNames) {
        req.originalFileNames = {};
      }
      req.originalFileNames[safeStorageFilename] = originalName;
      cb(null, safeStorageFilename);
    } catch (error) {
      const fallbackName = `${generateUUID()}${path.extname(file.originalname)}`;
      cb(null, fallbackName);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only PDF, JPG, PNG files are allowed. Got: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 200
  }
});

// Upload multiple files endpoint
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const workDetail = req.body.workDetail || '';
    const owner = req.body.owner || req.user?.username || 'system';
    const clientIp = req.ip || 'unknown';
    const folderTimestamp = req.folderTimestamp;
    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        let originalFilename = req.originalFileNames?.[file.filename] || Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fullFilePath = file.path;

        const result = await db.query(`
          INSERT INTO uploaded_files (filename, owner, work_detail, uploaded_at, client_ip, fullfile_path, folder_timestamp, similarity_status) 
          VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7) RETURNING *
        `, [originalFilename, owner, workDetail, clientIp, fullFilePath, folderTimestamp, 'No']);

        const savedFile = result.rows[0];

        if (file.mimetype === 'application/pdf') {
          await db.query(`
            INSERT INTO uploaded_files_page (file_id, filename, owner, work_detail, uploaded_at, client_ip, fullfile_path, folder_timestamp, page_number, similarity_status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [savedFile.id, originalFilename, owner, workDetail, savedFile.uploaded_at, clientIp, fullFilePath, folderTimestamp, 1, 'No']);
        }

        uploadedFiles.push({
          id: savedFile.id,
          filename: savedFile.filename,
          original_name: originalFilename,
          file_path: file.path,
          file_size: file.size,
          file_type: path.extname(originalFilename).slice(1).toUpperCase(),
          mime_type: file.mimetype,
          url: `/api/files/${savedFile.id}/view`,
        });
      } catch (fileError) {
        console.error('Error processing file:', file.originalname, fileError);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        uploadedFiles.push({ error: true, filename: file.originalname, message: fileError.message });
      }
    }

    const successCount = uploadedFiles.filter(f => !f.error).length;
    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${successCount} file(s)`,
      data: uploadedFiles.filter(f => !f.error)
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
};

// Get all files
const getAllFiles = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT id, filename, owner, work_detail, uploaded_at, ocr_text, receipt_date, total_amount, similarity_status 
      FROM uploaded_files ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const files = result.rows.map(file => ({
      ...file,
      original_name: file.filename,
      file_type: path.extname(file.filename).slice(1).toUpperCase(),
      mime_type: getMimeTypeFromExtension(file.filename)
    }));

    const countResult = await db.query('SELECT COUNT(*) FROM uploaded_files');
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch files: ' + error.message });
  }
};

// ✅✅✅ THIS IS THE FIXED FUNCTION ✅✅✅
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const fileResult = await db.query(`
      SELECT id, filename, owner, work_detail, uploaded_at, client_ip, ocr_text,
             receipt_date, total_amount, similarity_status, similar_to_file_id,
             similarity_score, fullfile_path, folder_timestamp
      FROM uploaded_files 
      WHERE id = $1
    `, [id]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = fileResult.rows[0];

    const pageResult = await db.query(`
      SELECT page_number, ocr_text, time_process, extract_taxid, extract_receipt,
             extract_entity, extract_number_of_receipt
      FROM uploaded_files_page 
      WHERE file_id = $1 ORDER BY page_number
    `, [id]);

    const pages = pageResult.rows || [];

    // --- NEW LOGIC START ---
    // If the main file's OCR text is empty but there are pages with text,
    // construct the main OCR text by joining the text from all pages.
    if (!file.ocr_text && pages.length > 0) {
      const fullOcrText = pages
        .map(p => p.ocr_text)    // Get ocr_text from each page
        .filter(Boolean)         // Filter out any empty/null page texts
        .join('\n\n--- Page Break ---\n\n'); // Join them with a separator

      if (fullOcrText) {
        file.ocr_text = fullOcrText; // Assign the aggregated text to the main file object
        console.log(`✅ Constructed aggregated OCR text for file ID: ${id}`);
      }
    }
    // --- NEW LOGIC END ---

    const fileExists = fs.existsSync(file.fullfile_path);

    res.json({
      success: true,
      data: {
        ...file, // Now 'file' contains the potentially aggregated ocr_text
        original_name: file.filename,
        file_size: fileExists ? fs.statSync(file.fullfile_path).size : 0,
        file_type: path.extname(file.filename).slice(1).toUpperCase(),
        mime_type: getMimeTypeFromExtension(file.filename),
        url: `/api/files/${file.id}/view`,
        download_url: `/api/files/${file.id}/download`,
        file_exists: fileExists,
        has_ocr: !!file.ocr_text, // This check is now more reliable
        pages: pages // Send the original page data as well
      }
    });

  } catch (error) {
    console.error('❌ Error fetching file:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch file: ' + error.message });
  }
};

// View file
const viewFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'File not found' });

    const file = result.rows[0];
    const filePath = file.fullfile_path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on disk' });

    const mimeType = getMimeTypeFromExtension(file.filename);
    res.setHeader('Content-Type', mimeType);
    const encodedFilename = encodeURIComponent(file.filename);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
    if (mimeType === 'application/pdf') {
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
    }
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to serve file: ' + error.message });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'File not found' });

    const file = result.rows[0];
    const filePath = file.fullfile_path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on disk' });

    const mimeType = getMimeTypeFromExtension(file.filename);
    res.setHeader('Content-Type', mimeType);
    const encodedFilename = encodeURIComponent(file.filename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to download file: ' + error.message });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'File not found' });

    const file = result.rows[0];
    await db.query('DELETE FROM uploaded_files_page WHERE file_id = $1', [id]);
    await db.query('DELETE FROM uploaded_files WHERE id = $1', [id]);

    if (fs.existsSync(file.fullfile_path)) fs.unlinkSync(file.fullfile_path);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete file: ' + error.message });
  }
};

// Helper function
const getMimeTypeFromExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// (getFileStatistics and other functions remain the same)
const getFileStatistics = async (req, res) => { /* ... implementation ... */ };

module.exports = {
  upload,
  uploadFiles,
  getAllFiles,
  getFileById,
  viewFile,
  downloadFile,
  deleteFile,
  getFileStatistics
};