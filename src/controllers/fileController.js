// src/controllers/fileController.js - เพิ่ม backup ไฟล์ที่อัปโหลด + รองรับ company_name, pn_name
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

// ✅ Helper to parse filename for company_name and pn_name
const parseFileName = (fileName) => {
  console.log(`🔍 Server-side parsing filename: "${fileName}"`);

  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  // Find first underscore (from left to right)
  const firstUnderscoreIndex = nameWithoutExt.indexOf('_');

  if (firstUnderscoreIndex === -1 || firstUnderscoreIndex === 0) {
    // No underscore found or underscore at beginning
    return {
      company_name: nameWithoutExt,
      pn_name: '',
      parsing_note: 'No valid underscore found - using entire name as company name'
    };
  }

  // Split by first underscore (reading from left to right)
  const company_name = nameWithoutExt.substring(0, firstUnderscoreIndex).trim();
  const pn_name = nameWithoutExt.substring(firstUnderscoreIndex + 1).trim();

  console.log(`🏢 Parsed company: "${company_name}", P/N: "${pn_name}"`);

  return {
    company_name: company_name || nameWithoutExt,
    pn_name: pn_name || '',
    parsing_note: `Parsed successfully: Company "${company_name}" + P/N "${pn_name}"`
  };
};

const db = require('../config/database');

// โฟลเดอร์ backup ไฟล์
const backupDir = 'D:\\github\\n8n\\n8n\\backup';

// สร้างโฟลเดอร์ backup ถ้ายังไม่มี
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

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

// ✅ Enhanced Upload multiple files endpoint with company_name and pn_name support
const uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const workDetail = req.body.workDetail || '';
    const owner = req.body.owner || req.user?.username || 'system';
    const clientIp = req.ip || 'unknown';
    const folderTimestamp = req.folderTimestamp;
    const hasParsedData = req.body.hasParsedData === 'true';
    const uploadedFiles = [];

    console.log(`📤 Processing ${req.files.length} files with parsed data support...`);
    if (hasParsedData) {
      console.log('✅ Request contains parsed company/PN data from frontend');
    }

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        let originalFilename = req.originalFileNames?.[file.filename] || Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fullFilePath = file.path;

        // ✅ Get company_name and pn_name from frontend or parse from filename
        let company_name, pn_name, parsing_note;

        if (hasParsedData && req.body[`company_name_${i}`] !== undefined) {
          // Use data from frontend
          company_name = req.body[`company_name_${i}`] || '';
          pn_name = req.body[`pn_name_${i}`] || '';
          parsing_note = 'Parsed by frontend';
          console.log(`🎯 Using frontend parsed data for file ${i}: Company="${company_name}", P/N="${pn_name}"`);
        } else {
          // Parse filename on server side as fallback
          const parsed = parseFileName(originalFilename);
          company_name = parsed.company_name;
          pn_name = parsed.pn_name;
          parsing_note = parsed.parsing_note;
          console.log(`🔄 Server-side parsing for file ${i}: Company="${company_name}", P/N="${pn_name}"`);
        }

        // บันทึกข้อมูลไฟล์ใน DB พร้อมสถานะ similarity_status = 'No' และข้อมูลที่แยกได้
        const result = await db.query(`
          INSERT INTO uploaded_files (
            filename, owner, work_detail, uploaded_at, client_ip, fullfile_path, 
            folder_timestamp, similarity_status, company_name, pn_name
          ) 
          VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9) 
          RETURNING *
        `, [originalFilename, owner, workDetail, clientIp, fullFilePath, folderTimestamp, 'No', company_name, pn_name]);

        const savedFile = result.rows[0];

        // ถ้าเป็น PDF บันทึกหน้าที่ 1 ลงตาราง uploaded_files_page
        if (file.mimetype === 'application/pdf') {
          await db.query(`
            INSERT INTO uploaded_files_page (
              file_id, filename, owner, work_detail, uploaded_at, client_ip, 
              fullfile_path, folder_timestamp, page_number, similarity_status
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [savedFile.id, originalFilename, owner, workDetail, savedFile.uploaded_at, clientIp, fullFilePath, folderTimestamp, 1, 'No']);
        }

        // ** Backup ไฟล์ไปยัง backupDir **
        const backupFilePath = path.join(backupDir, path.basename(file.path));
        try {
          fs.copyFileSync(fullFilePath, backupFilePath);
          console.log(`✅ Backup file created: ${backupFilePath}`);
        } catch (backupErr) {
          console.error(`❌ Backup failed for file ${originalFilename}:`, backupErr.message);
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
          company_name: savedFile.company_name,
          pn_name: savedFile.pn_name,
          parsing_note: parsing_note
        });

        console.log(`✅ File ${i + 1}/${req.files.length} processed: ${originalFilename}`);

      } catch (fileError) {
        console.error(`❌ Error processing file ${i}:`, file.originalname, fileError);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        uploadedFiles.push({ error: true, filename: file.originalname, message: fileError.message });
      }
    }

    const successCount = uploadedFiles.filter(f => !f.error).length;
    const errorCount = uploadedFiles.filter(f => f.error).length;

    console.log(`📊 Upload summary: ${successCount} success, ${errorCount} errors`);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${successCount} file(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
      data: uploadedFiles.filter(f => !f.error),
      errors: uploadedFiles.filter(f => f.error),
      parsing_enabled: true
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
};

// ✅ Enhanced Get all files with company/pn search support
const getAllFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      company_name,
      pn_name,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (company_name) {
      whereConditions.push(`uf.company_name ILIKE $${paramIndex}`);
      queryParams.push(`%${company_name}%`);
      paramIndex++;
    }

    if (pn_name) {
      whereConditions.push(`uf.pn_name ILIKE $${paramIndex}`);
      queryParams.push(`%${pn_name}%`);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        uf.filename ILIKE $${paramIndex} OR 
        uf.company_name ILIKE $${paramIndex} OR 
        uf.pn_name ILIKE $${paramIndex} OR 
        uf.work_detail ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Add pagination parameters
    queryParams.push(limit, offset);
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const query = `
      SELECT 
        uf.id, 
        uf.filename, 
        uf.owner, 
        uf.work_detail, 
        uf.uploaded_at, 
        uf.ocr_text, 
        uf.receipt_date, 
        uf.total_amount, 
        uf.similarity_status,
        uf.company_name,
        uf.pn_name,
        ufp.extract_entity,
        ufp.extract_taxid,
        ufp.extract_receipt,
        ufp.extract_number_of_receipt,
        ufp.quality_check AS quality_check_status,
        ufp.processing_status
      FROM 
        uploaded_files AS uf
      LEFT JOIN 
        uploaded_files_page AS ufp ON uf.id = ufp.file_id AND ufp.page_number = 1
      ${whereClause}
      ORDER BY 
        uf.uploaded_at DESC 
      ${limitClause}
    `;

    console.log('🔍 Search query:', { company_name, pn_name, search });

    const result = await db.query(query, queryParams);

    const files = result.rows.map(file => ({
      ...file,
      original_name: file.filename,
      file_type: path.extname(file.filename).slice(1).toUpperCase(),
      mime_type: getMimeTypeFromExtension(file.filename)
    }));

    // Count total for pagination (use same WHERE clause)
    const countQuery = `SELECT COUNT(*) FROM uploaded_files AS uf ${whereClause}`;
    const countParams = queryParams.slice(0, queryParams.length - 2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      search_criteria: {
        company_name,
        pn_name,
        search
      }
    });
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files: ' + error.message });
  }
};

// ✅ Enhanced Get file by ID with company/pn data
const getFileById = async (req, res) => {
  try {
    const { id } = req.params;

    const fileResult = await db.query(`
      SELECT id, filename, owner, work_detail, uploaded_at, client_ip, ocr_text,
             receipt_date, total_amount, similarity_status, similar_to_file_id,
             similarity_score, fullfile_path, folder_timestamp,
             company_name, pn_name
      FROM uploaded_files 
      WHERE id = $1
    `, [id]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = fileResult.rows[0];

    const pageResult = await db.query(`
      SELECT page_number, ocr_text, time_process, extract_taxid, extract_receipt,
             extract_entity, extract_number_of_receipt, quality_check as quality_check_status, processing_status
      FROM uploaded_files_page 
      WHERE file_id = $1 ORDER BY page_number
    `, [id]);

    const pages = pageResult.rows || [];

    // รวม ocr text จากทุกหน้า
    if (!file.ocr_text && pages.length > 0) {
      const fullOcrText = pages
        .map(p => p.ocr_text)
        .filter(Boolean)
        .join('\n\n--- Page Break ---\n\n');

      if (fullOcrText) {
        file.ocr_text = fullOcrText;
        console.log(`✅ Constructed aggregated OCR text for file ID: ${id}`);
      }
    }

    const fileExists = fs.existsSync(file.fullfile_path);

    const firstPageData = pages.length > 0 ? pages[0] : {};

    const responseData = {
      ...file,
      ...firstPageData,
      original_name: file.filename,
      file_size: fileExists ? fs.statSync(file.fullfile_path).size : 0,
      file_type: path.extname(file.filename).slice(1).toUpperCase(),
      mime_type: getMimeTypeFromExtension(file.filename),
      url: `/api/files/${file.id}/view`,
      download_url: `/api/files/${file.id}/download`,
      file_exists: fileExists,
      has_ocr: !!file.ocr_text,
      pages: pages
    };

    res.json({
      success: true,
      data: responseData
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

// ✨ ADDED: Function to update file details
const updateFileDetails = async (req, res) => {
  const { id } = req.params;
  const fieldsToUpdate = req.body;

  // Whitelist of fields that are allowed to be updated
  const allowedFields = ['extract_entity', 'extract_number_of_receipt', 'extract_taxid', 'extract_receipt', 'quality_check', 'processing_status'];
  const validFields = Object.keys(fieldsToUpdate).filter(key => allowedFields.includes(key));

  if (validFields.length === 0) {
    return res.status(400).json({ success: false, message: "No valid fields provided for update." });
  }

  try {
    // Dynamically build the SET clause for the SQL query
    const setClause = validFields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
    const queryParams = validFields.map(key => fieldsToUpdate[key]);
    queryParams.push(id);

    // Assume updates are for the primary page record (page_number = 1)
    const query = `
      UPDATE uploaded_files_page 
      SET ${setClause} 
      WHERE file_id = $${queryParams.length} AND page_number = 1
      RETURNING *;
    `;

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File page record not found to update.' });
    }

    res.json({ success: true, message: 'File details updated successfully.', data: result.rows[0] });

  } catch (error) {
    console.error('❌ Error updating file details:', error);
    res.status(500).json({ success: false, message: 'Failed to update file details.' });
  }
};


// ✅ Enhanced File statistics endpoint with company/pn insights
const getFileStatistics = async (req, res) => {
  try {
    const totalFilesResult = await db.query('SELECT COUNT(*) FROM uploaded_files');
    const today = new Date().toISOString().slice(0, 10);
    const todaysFilesResult = await db.query('SELECT COUNT(*) FROM uploaded_files WHERE DATE(uploaded_at) = $1', [today]);

    // <<< MODIFIED: แก้ไขให้นับจำนวนจากตาราง uploaded_files_page
    const pendingResult = await db.query("SELECT COUNT(*) FROM uploaded_files_page WHERE processing_status = 'Processing'");
    const processedResult = await db.query("SELECT COUNT(*) FROM uploaded_files_page WHERE processing_status = 'Processed'");

    // Company statistics
    const companiesResult = await db.query(`
      SELECT 
        company_name, 
        COUNT(*) as file_count,
        COUNT(DISTINCT pn_name) as unique_pn_count
      FROM uploaded_files 
      WHERE company_name IS NOT NULL AND company_name != ''
      GROUP BY company_name 
      ORDER BY file_count DESC 
      LIMIT 10
    `);

    // P/N statistics
    const pnResult = await db.query(`
      SELECT 
        pn_name, 
        company_name,
        COUNT(*) as file_count
      FROM uploaded_files 
      WHERE pn_name IS NOT NULL AND pn_name != ''
      GROUP BY pn_name, company_name 
      ORDER BY file_count DESC 
      LIMIT 10
    `);

    // Files without parsing data
    const unparsedResult = await db.query(`
      SELECT COUNT(*) FROM uploaded_files 
      WHERE company_name IS NULL OR company_name = '' OR pn_name IS NULL OR pn_name = ''
    `);

    res.json({
      success: true,
      data: {
        totalFiles: parseInt(totalFilesResult.rows[0].count),
        todaysFiles: parseInt(todaysFilesResult.rows[0].count),
        pendingFiles: parseInt(pendingResult.rows[0].count),
        processedFiles: parseInt(processedResult.rows[0].count),
        unparsedFiles: parseInt(unparsedResult.rows[0].count),
        topCompanies: companiesResult.rows,
        topPN: pnResult.rows,
        parsing_stats: {
          total_companies: companiesResult.rows.length,
          total_unique_pn: pnResult.rows.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics: ' + error.message });
  }
};

// ✅ New endpoint: Get company statistics
const getCompanyStatistics = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const companiesResult = await db.query(`
      SELECT 
        company_name,
        COUNT(*) as total_files,
        COUNT(DISTINCT pn_name) as unique_pn_count,
        MIN(uploaded_at) as first_upload,
        MAX(uploaded_at) as last_upload,
        ARRAY_AGG(DISTINCT pn_name ORDER BY pn_name) FILTER (WHERE pn_name IS NOT NULL AND pn_name != '') as pn_list
      FROM uploaded_files 
      WHERE company_name IS NOT NULL AND company_name != ''
      GROUP BY company_name 
      ORDER BY total_files DESC 
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: {
        companies: companiesResult.rows,
        total_companies: companiesResult.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting company statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get company statistics: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadFiles,
  getAllFiles,
  getFileById,
  viewFile,
  downloadFile,
  deleteFile,
  getFileStatistics,
  getCompanyStatistics,
  updateFileDetails // ✨ ADDED: เพิ่ม function ใหม่เข้าไปใน exports
};