// src/controllers/fileController.js - With Thai Language Support
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Generate UUID without external library
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ✅ Helper function to safely handle Thai filenames
const sanitizeThaiFilename = (filename) => {
  // Log original filename for debugging
  console.log('📄 Original filename:', filename);
  console.log('📄 Filename length:', filename.length);
  console.log('📄 Filename buffer:', Buffer.from(filename, 'utf8'));
  
  // Return as-is but ensure UTF-8 encoding
  const sanitized = Buffer.from(filename, 'utf8').toString('utf8');
  console.log('✅ Sanitized filename:', sanitized);
  
  return sanitized;
};

// ✅ Helper function to create safe storage filename while preserving original
const createSafeStorageFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  
  // Create UUID-based filename for storage (to avoid filesystem issues)
  const uuid = generateUUID();
  const safeFilename = `${uuid}${ext}`;
  
  console.log('🔄 Storage mapping:', { 
    original: originalFilename, 
    storage: safeFilename 
  });
  
  return safeFilename;
};

const db = require('../config/database');

// ✅ Configure multer with Thai language support
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create timestamp-based folder structure
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const uploadDir = path.join(__dirname, '../../uploads', timestamp);
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Store timestamp in request for later use
    if (!req.folderTimestamp) {
      req.folderTimestamp = timestamp;
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      // ✅ Handle Thai characters properly
      console.log('🌏 Processing file with original name:', file.originalname);
      
      // Ensure originalname is properly encoded
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      console.log('🔤 Decoded filename:', originalName);
      
      // Create safe storage filename
      const safeStorageFilename = createSafeStorageFilename(originalName);
      
      // Store original filename in request for database
      if (!req.originalFileNames) {
        req.originalFileNames = {};
      }
      req.originalFileNames[safeStorageFilename] = originalName;
      
      console.log('✅ Using storage filename:', safeStorageFilename);
      cb(null, safeStorageFilename);
      
    } catch (error) {
      console.error('❌ Error processing filename:', error);
      // Fallback to UUID filename
      const fallbackName = `${generateUUID()}${path.extname(file.originalname)}`;
      console.log('🔄 Using fallback filename:', fallbackName);
      cb(null, fallbackName);
    }
  }
});

const fileFilter = (req, file, cb) => {
  try {
    // ✅ Handle Thai characters in file type detection
    console.log('🔍 File filter - mimetype:', file.mimetype);
    console.log('🔍 File filter - originalname:', file.originalname);
    
    // Allow only specific file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`Invalid file type. Only PDF, JPG, PNG files are allowed. Got: ${file.mimetype}`);
      console.error('❌ File type rejected:', error.message);
      cb(error, false);
    }
  } catch (error) {
    console.error('❌ Error in file filter:', error);
    cb(error, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 200 // Maximum 200 files per upload
  }
});

// ✅ Upload multiple files endpoint with Thai support
const uploadFiles = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('📦 Files count:', req.files?.length || 0);
    console.log('🌏 Request body:', req.body);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // ✅ Handle Thai characters in work detail
    const workDetail = req.body.workDetail || '';
    const owner = req.body.owner || req.user?.username || 'system';
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const folderTimestamp = req.folderTimestamp;
    const uploadedFiles = [];

    console.log('📝 Work detail:', workDetail);
    console.log('👤 Owner:', owner);

    // Process each uploaded file
    for (const file of req.files) {
      try {
        console.log('📄 Processing file:', file.filename);
        
        // Get original filename (with Thai support)
        let originalFilename;
        if (req.originalFileNames && req.originalFileNames[file.filename]) {
          originalFilename = req.originalFileNames[file.filename];
        } else {
          // Fallback: try to decode from originalname
          try {
            originalFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
          } catch (decodeError) {
            console.warn('⚠️ Filename decode failed, using as-is:', file.originalname);
            originalFilename = file.originalname;
          }
        }
        
        console.log('✅ Final original filename:', originalFilename);
        
        // Calculate full file path
        const fullFilePath = file.path;
        const relativePath = path.relative(path.join(__dirname, '../..'), fullFilePath);
        
        // ✅ Insert into uploaded_files table with UTF-8 support
        const result = await db.query(`
          INSERT INTO uploaded_files (
            filename, 
            owner, 
            work_detail,
            uploaded_at,
            client_ip,
            fullfile_path,
            folder_timestamp,
            similarity_status
          ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
          RETURNING *
        `, [
          originalFilename,  // ✅ Use original Thai filename
          owner,
          workDetail,
          clientIp,
          fullFilePath,
          folderTimestamp,
          'No'
        ]);

        const savedFile = result.rows[0];
        console.log('✅ File saved to database with ID:', savedFile.id);
        console.log('📝 Saved filename:', savedFile.filename);

        // ✅ For PDFs, create entries in uploaded_files_page table
        if (file.mimetype === 'application/pdf') {
          await db.query(`
            INSERT INTO uploaded_files_page (
              file_id,
              filename,
              owner,
              work_detail,
              uploaded_at,
              client_ip,
              fullfile_path,
              folder_timestamp,
              page_number,
              similarity_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            savedFile.id,
            originalFilename,  // ✅ Use original Thai filename
            owner,
            workDetail,
            savedFile.uploaded_at,
            clientIp,
            fullFilePath,
            folderTimestamp,
            1,
            'No'
          ]);
        }

        // Prepare response data
        uploadedFiles.push({
          id: savedFile.id,
          filename: savedFile.filename,
          original_name: originalFilename,
          storage_filename: file.filename,  // Internal storage filename
          file_path: relativePath,
          file_size: file.size,
          file_type: path.extname(originalFilename).slice(1).toUpperCase(),
          mime_type: file.mimetype,
          work_detail: savedFile.work_detail,
          owner: savedFile.owner,
          uploaded_at: savedFile.uploaded_at,
          client_ip: savedFile.client_ip,
          fullfile_path: savedFile.fullfile_path,
          folder_timestamp: savedFile.folder_timestamp,
          similarity_status: savedFile.similarity_status,
          // Add URLs for frontend access
          url: `/api/files/${savedFile.id}/view`,
          download_url: `/api/files/${savedFile.id}/download`
        });

      } catch (fileError) {
        console.error('❌ Error processing file:', file.originalname, fileError);
        // Delete the uploaded file if database insert fails
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        // Add error info to response
        uploadedFiles.push({
          error: true,
          filename: file.originalname,
          message: fileError.message
        });
      }
    }

    if (uploadedFiles.filter(f => !f.error).length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process any files',
        errors: uploadedFiles.filter(f => f.error)
      });
    }

    const successCount = uploadedFiles.filter(f => !f.error).length;
    const errorCount = uploadedFiles.filter(f => f.error).length;

    console.log(`✅ Upload completed: ${successCount} success, ${errorCount} errors`);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${successCount} file(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
      data: uploadedFiles.filter(f => !f.error),
      errors: uploadedFiles.filter(f => f.error),
      count: successCount
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message
    });
  }
};

// ✅ Get all files - with Thai filename support
const getAllFiles = async (req, res) => {
  try {
    const { page = 1, limit = 50, similarity_status, owner } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams = [];

    if (similarity_status) {
      whereClause += ' WHERE similarity_status = $' + (queryParams.length + 1);
      queryParams.push(similarity_status);
    }

    if (owner) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' owner = $' + (queryParams.length + 1);
      queryParams.push(owner);
    }

    // ✅ Query with proper UTF-8 handling
    const query = `
      SELECT 
        id,
        filename,
        owner,
        work_detail,
        uploaded_at,
        client_ip,
        ocr_text,
        receipt_date,
        total_amount,
        similarity_status,
        similar_to_file_id,
        similarity_score,
        fullfile_path,
        folder_timestamp
      FROM uploaded_files
      ${whereClause}
      ORDER BY uploaded_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    // Add computed fields and URLs to each file
    const files = result.rows.map(file => {
      // ✅ Ensure Thai characters are properly handled
      console.log('📄 Retrieved filename:', file.filename);
      
      return {
        ...file,
        original_name: file.filename, // This now contains Thai characters
        file_size: 0, // Would need to calculate from file system if needed
        file_type: path.extname(file.filename).slice(1).toUpperCase(),
        mime_type: getMimeTypeFromExtension(file.filename),
        url: `/api/files/${file.id}/view`,
        download_url: `/api/files/${file.id}/download`,
        has_ocr: !!file.ocr_text,
        has_receipt_data: !!(file.receipt_date || file.total_amount),
        is_suspicious: file.similarity_status === 'Yes'
      };
    });

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM uploaded_files ${whereClause}`;
    const countResult = await db.query(countQuery, whereClause ? queryParams.slice(0, -2) : []);
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
    console.error('❌ Error fetching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files: ' + error.message
    });
  }
};

// ✅ Download file with Thai filename support
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = result.rows[0];
    const filePath = file.fullfile_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const mimeType = getMimeTypeFromExtension(file.filename);

    // ✅ Set download headers with proper Thai filename encoding
    res.setHeader('Content-Type', mimeType);
    
    // Encode Thai filename properly for download
    const encodedFilename = encodeURIComponent(file.filename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', stats.size);

    console.log('📥 Downloading file:', file.filename);
    console.log('🔤 Encoded filename:', encodedFilename);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file: ' + error.message
    });
  }
};

// ✅ View file with Thai filename support
const viewFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = result.rows[0];
    const filePath = file.fullfile_path;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Get mime type
    const mimeType = getMimeTypeFromExtension(file.filename);

    // ✅ Set appropriate headers with Thai filename support
    res.setHeader('Content-Type', mimeType);
    
    // For inline viewing, encode filename properly
    const encodedFilename = encodeURIComponent(file.filename);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
    
    // ✅ FIXED: For PDFs, allow iframe viewing from any origin
    if (mimeType === 'application/pdf') {
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
    }

    console.log('👁️ Viewing file:', file.filename);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve file: ' + error.message
    });
  }
};

// Keep other functions the same...
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const fileResult = await db.query(`
      SELECT 
        id,
        filename,
        owner,
        work_detail,
        uploaded_at,
        client_ip,
        ocr_text,
        receipt_date,
        total_amount,
        similarity_status,
        similar_to_file_id,
        similarity_score,
        fullfile_path,
        folder_timestamp
      FROM uploaded_files 
      WHERE id = $1
    `, [id]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = fileResult.rows[0];

    const pageResult = await db.query(`
      SELECT 
        page_number,
        ocr_text,
        time_process,
        extract_taxid,
        extract_receipt,
        extract_entity,
        extract_number_of_receipt
      FROM uploaded_files_page 
      WHERE file_id = $1
      ORDER BY page_number
    `, [id]);

    const fileExists = fs.existsSync(file.fullfile_path);

    res.json({
      success: true,
      data: {
        ...file,
        original_name: file.filename,
        file_size: fileExists ? fs.statSync(file.fullfile_path).size : 0,
        file_type: path.extname(file.filename).slice(1).toUpperCase(),
        mime_type: getMimeTypeFromExtension(file.filename),
        url: `/api/files/${file.id}/view`,
        download_url: `/api/files/${file.id}/download`,
        file_exists: fileExists,
        has_ocr: !!file.ocr_text,
        has_receipt_data: !!(file.receipt_date || file.total_amount),
        is_suspicious: file.similarity_status === 'Yes',
        pages: pageResult.rows || []
      }
    });

  } catch (error) {
    console.error('❌ Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file: ' + error.message
    });
  }
};

const updateFileStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      ocr_text, 
      receipt_date, 
      total_amount, 
      similarity_status, 
      similar_to_file_id, 
      similarity_score 
    } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (ocr_text) {
      updateFields.push(`ocr_text = $${paramCount}`);
      values.push(ocr_text);
      paramCount++;
    }

    if (receipt_date) {
      updateFields.push(`receipt_date = $${paramCount}`);
      values.push(receipt_date);
      paramCount++;
    }

    if (total_amount) {
      updateFields.push(`total_amount = $${paramCount}`);
      values.push(total_amount);
      paramCount++;
    }

    if (similarity_status) {
      updateFields.push(`similarity_status = $${paramCount}`);
      values.push(similarity_status);
      paramCount++;
    }

    if (similar_to_file_id) {
      updateFields.push(`similar_to_file_id = $${paramCount}`);
      values.push(similar_to_file_id);
      paramCount++;
    }

    if (similarity_score) {
      updateFields.push(`similarity_score = $${paramCount}`);
      values.push(similarity_score);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);

    const query = `
      UPDATE uploaded_files 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file: ' + error.message
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = result.rows[0];
    const filePath = file.fullfile_path;

    await db.query('DELETE FROM uploaded_files_page WHERE file_id = $1', [id]);
    await db.query('DELETE FROM uploaded_files WHERE id = $1', [id]);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Physical file deleted:', filePath);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file: ' + error.message
    });
  }
};

const getOCRResult = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT id, filename, ocr_text, receipt_date, total_amount, uploaded_at
      FROM uploaded_files 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = result.rows[0];

    if (!file.ocr_text) {
      return res.status(404).json({
        success: false,
        message: 'OCR result not available for this file'
      });
    }

    res.json({
      success: true,
      data: {
        id: file.id,
        filename: file.filename,
        ocr_text: file.ocr_text,
        receipt_date: file.receipt_date,
        total_amount: file.total_amount,
        uploaded_at: file.uploaded_at
      }
    });

  } catch (error) {
    console.error('❌ Error fetching OCR result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OCR result: ' + error.message
    });
  }
};

const getFileStatistics = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(CASE WHEN similarity_status = 'Yes' THEN 1 END) as suspicious_files,
        COUNT(CASE WHEN similarity_status = 'No' THEN 1 END) as normal_files,
        COUNT(CASE WHEN DATE(uploaded_at) = CURRENT_DATE THEN 1 END) as today_files,
        COUNT(CASE WHEN ocr_text IS NOT NULL THEN 1 END) as files_with_ocr,
        COUNT(CASE WHEN receipt_date IS NOT NULL OR total_amount IS NOT NULL THEN 1 END) as files_with_receipt_data,
        COUNT(DISTINCT owner) as unique_uploaders,
        AVG(similarity_score) as avg_similarity_score
      FROM uploaded_files
    `);

    const pageStats = await db.query(`
      SELECT 
        COUNT(*) as total_pages,
        COUNT(CASE WHEN ocr_text IS NOT NULL THEN 1 END) as pages_with_ocr
      FROM uploaded_files_page
    `);

    const statistics = stats.rows[0];
    const pageStatistics = pageStats.rows[0];

    res.json({
      success: true,
      data: {
        total_files: parseInt(statistics.total_files),
        suspicious_files: parseInt(statistics.suspicious_files),
        normal_files: parseInt(statistics.normal_files),
        today_files: parseInt(statistics.today_files),
        files_with_ocr: parseInt(statistics.files_with_ocr),
        files_with_receipt_data: parseInt(statistics.files_with_receipt_data),
        unique_uploaders: parseInt(statistics.unique_uploaders),
        avg_similarity_score: parseFloat(statistics.avg_similarity_score || 0),
        total_pages: parseInt(pageStatistics.total_pages),
        pages_with_ocr: parseInt(pageStatistics.pages_with_ocr),
        suspicious_rate: statistics.total_files > 0 
          ? Math.round((statistics.suspicious_files / statistics.total_files) * 100) 
          : 0,
        ocr_coverage: statistics.total_files > 0 
          ? Math.round((statistics.files_with_ocr / statistics.total_files) * 100) 
          : 0,
        receipt_processing_rate: statistics.total_files > 0 
          ? Math.round((statistics.files_with_receipt_data / statistics.total_files) * 100) 
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics: ' + error.message
    });
  }
};

const getMimeTypeFromExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

module.exports = {
  upload,
  uploadFiles,
  getAllFiles,
  getFileById,
  updateFileStatus,
  viewFile,
  downloadFile,
  deleteFile,
  getOCRResult,
  getFileStatistics
};