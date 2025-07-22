const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Pool } = require('pg');

// --- Database Connection ---
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'n8n',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
});

// --- Helper Functions ---
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
const createSafeStorageFilename = (originalFilename) => `${generateUUID()}${path.extname(originalFilename)}`;
const parseFileName = (fileName) => {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const firstUnderscoreIndex = nameWithoutExt.indexOf('_');
  if (firstUnderscoreIndex === -1 || firstUnderscoreIndex === 0) {
    return { company_name: nameWithoutExt, pn_name: '' };
  }
  const company_name = nameWithoutExt.substring(0, firstUnderscoreIndex).trim();
  const pn_name = nameWithoutExt.substring(firstUnderscoreIndex + 1).trim();
  return { company_name: company_name || nameWithoutExt, pn_name: pn_name || '' };
};
const getMimeTypeFromExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
  return mimeTypes[ext] || 'application/octet-stream';
};

// --- Directory Setup ---
const backupDir = path.join(__dirname, '../../backup');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const uploadDir = path.join(__dirname, '../../uploads', timestamp);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    req.folderTimestamp = timestamp;
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeStorageFilename = createSafeStorageFilename(originalName);
    if (!req.originalFileNames) req.originalFileNames = {};
    req.originalFileNames[safeStorageFilename] = originalName;
    cb(null, safeStorageFilename);
  }
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`), false);
  }
};
exports.upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 50 * 1024 * 1024, files: 200 } });

// --- Controller Functions ---

// ✅ Fixed Upload Function
exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const workDetail = req.body.workDetail || '';
    const owner = req.body.owner || req.user?.username || 'system';
    const clientIp = req.ip || 'unknown';
    const folderTimestamp = req.folderTimestamp;
    const hasParsedData = req.body.hasParsedData === 'true';
    const uploadedFilesResult = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        const originalFilename = req.originalFileNames?.[file.filename] || Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fullFilePath = file.path;
        const { size, mimetype } = file;
        let company_name, pn_name;

        if (hasParsedData && req.body[`company_name_${i}`] !== undefined) {
          company_name = req.body[`company_name_${i}`] || '';
          pn_name = req.body[`pn_name_${i}`] || '';
        } else {
          const parsed = parseFileName(originalFilename);
          company_name = parsed.company_name;
          pn_name = parsed.pn_name;
        }

        // 🚨 FIXED: Corrected column count and parameter alignment
        const result = await db.query(
          `INSERT INTO uploaded_files (
            filename, 
            owner, 
            work_detail, 
            client_ip, 
            fullfile_path, 
            folder_timestamp, 
            similarity_status, 
            company_name, 
            pn_name, 
            processing_status
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            originalFilename,    // $1
            owner,              // $2
            workDetail,         // $3
            clientIp,           // $4
            fullFilePath,       // $5
            folderTimestamp,    // $6
            'No',              // $7 - similarity_status
            company_name,       // $8
            pn_name,           // $9
            'pending'          // $10 - processing_status
          ]
        );
        
        const savedFile = result.rows[0];

        // Handle PDF files - insert page record
        if (file.mimetype === 'application/pdf') {
          await db.query(
            `INSERT INTO uploaded_files_page(
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
             ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              savedFile.id,           // $1
              originalFilename,       // $2
              owner,                 // $3
              workDetail,            // $4
              savedFile.uploaded_at, // $5
              clientIp,              // $6
              fullFilePath,          // $7
              folderTimestamp,       // $8
              1,                     // $9 - page_number
              'No'                   // $10 - similarity_status
            ]
          );
        }

        // Create backup copy
        const backupFilePath = path.join(backupDir, path.basename(file.path));
        fs.copyFileSync(fullFilePath, backupFilePath);
        uploadedFilesResult.push({ id: savedFile.id, filename: originalFilename });

      } catch (fileError) {
        console.error(`❌ Error processing file ${file.originalname}:`, fileError);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Successfully uploaded ${uploadedFilesResult.length} file(s).`, 
      data: uploadedFilesResult 
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
};

exports.getAllFiles = async (req, res) => {
  try {
    const { page = 1, limit = 50, company_name, pn_name, search, processing_status, quality_check } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const queryParams = [];
    let paramCounter = 1;

    if (company_name) { conditions.push(`uf.company_name ILIKE $${paramCounter++}`); queryParams.push(`%${company_name}%`); }
    if (pn_name) { conditions.push(`uf.pn_name ILIKE $${paramCounter++}`); queryParams.push(`%${pn_name}%`); }
    if (search) { conditions.push(`uf.filename ILIKE $${paramCounter++}`); queryParams.push(`%${search}%`); }
    if (processing_status) { conditions.push(`uf.processing_status = $${paramCounter++}`); queryParams.push(processing_status); }
    if (quality_check) { conditions.push(`uf.quality_checks = $${paramCounter++}`); queryParams.push(quality_check); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = `LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(limit, offset);

    const query = `SELECT * FROM uploaded_files AS uf ${whereClause} ORDER BY uf.id DESC ${limitClause}`;
    const result = await db.query(query, queryParams);

    const countQuery = `SELECT COUNT(*) FROM uploaded_files AS uf ${whereClause}`;
    const countParams = queryParams.slice(0, queryParams.length - 2);
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: totalCount, pages: Math.ceil(totalCount / limit) }
    });
  } catch (error) {
    console.error('❌ Error in getAllFiles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files: ' + error.message });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const fileResult = await db.query(`SELECT * FROM uploaded_files WHERE id = $1`, [id]);
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const file = fileResult.rows[0];
    const pageResult = await db.query(`SELECT * FROM uploaded_files_page WHERE file_id = $1 ORDER BY page_number`, [id]);
    res.json({ success: true, data: { ...file, pages: pageResult.rows || [] } });
  } catch (error) {
    console.error('❌ Error in getFileById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch file: ' + error.message });
  }
};

exports.viewFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found in database' });
    }
    const file = result.rows[0];
    const filePath = file.fullfile_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }
    const mimeType = getMimeTypeFromExtension(file.filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('❌ Error in viewFile:', error);
    res.status(500).json({ success: false, message: 'Failed to serve file: ' + error.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'File not found' });
    const file = result.rows[0];
    const filePath = file.fullfile_path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on disk' });
    res.download(filePath, file.filename);
  } catch (error) {
    console.error('❌ Error in downloadFile:', error);
    res.status(500).json({ success: false, message: 'Failed to download file: ' + error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM uploaded_files WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'File not found' });
    const file = result.rows[0];
    await db.query('DELETE FROM uploaded_files_page WHERE file_id = $1', [id]);
    await db.query('DELETE FROM uploaded_files WHERE id = $1', [id]);
    if (fs.existsSync(file.fullfile_path)) {
      fs.unlinkSync(file.fullfile_path);
    }
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('❌ Error in deleteFile:', error);
    res.status(500).json({ success: false, message: 'Failed to delete file: ' + error.message });
  }
};

exports.getFileStatistics = async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) FROM uploaded_files');
    const todayResult = await db.query('SELECT COUNT(*) FROM uploaded_files WHERE DATE(uploaded_at) = CURRENT_DATE');
    const pendingResult = await db.query("SELECT COUNT(*) FROM uploaded_files WHERE processing_status = 'pending'");
    const processedResult = await db.query("SELECT COUNT(*) FROM uploaded_files WHERE processing_status IN ('processed', 'complete')");
    res.json({
      success: true,
      data: {
        totalFiles: parseInt(totalResult.rows[0].count, 10),
        todaysFiles: parseInt(todayResult.rows[0].count, 10),
        pendingFiles: parseInt(pendingResult.rows[0].count, 10),
        processedFiles: parseInt(processedResult.rows[0].count, 10),
      }
    });
  } catch (error) {
    console.error('❌ Error in getFileStatistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics: ' + error.message });
  }
};

// ✅ Fixed Company Statistics Function - Properly Exported
exports.getCompanyStatistics = async (req, res) => {
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

// ✅ New Function: Update File Information
exports.updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      company_name, 
      pn_name, 
      work_detail, 
      processing_status, 
      quality_checks,
      ocr_text,
      receipt_date,
      total_amount 
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;

    if (company_name !== undefined) { 
      updateFields.push(`company_name = $${paramCounter++}`); 
      queryParams.push(company_name); 
    }
    if (pn_name !== undefined) { 
      updateFields.push(`pn_name = $${paramCounter++}`); 
      queryParams.push(pn_name); 
    }
    if (work_detail !== undefined) { 
      updateFields.push(`work_detail = $${paramCounter++}`); 
      queryParams.push(work_detail); 
    }
    if (processing_status !== undefined) { 
      updateFields.push(`processing_status = $${paramCounter++}`); 
      queryParams.push(processing_status); 
    }
    if (quality_checks !== undefined) { 
      updateFields.push(`quality_checks = $${paramCounter++}`); 
      queryParams.push(quality_checks); 
    }
    if (ocr_text !== undefined) { 
      updateFields.push(`ocr_text = $${paramCounter++}`); 
      queryParams.push(ocr_text); 
    }
    if (receipt_date !== undefined) { 
      updateFields.push(`receipt_date = $${paramCounter++}`); 
      queryParams.push(receipt_date); 
    }
    if (total_amount !== undefined) { 
      updateFields.push(`total_amount = $${paramCounter++}`); 
      queryParams.push(total_amount); 
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    // Add processed_at timestamp if processing_status is being set to complete
    if (processing_status === 'complete') {
      updateFields.push(`processed_at = NOW()`);
    }

    queryParams.push(id); // Add ID as last parameter
    const query = `UPDATE uploaded_files SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

    const result = await db.query(query, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.json({
      success: true,
      message: 'File updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error in updateFile:', error);
    res.status(500).json({ success: false, message: 'Failed to update file: ' + error.message });
  }
};

// ✅ New Function: Bulk Update Files
exports.bulkUpdateFiles = async (req, res) => {
  try {
    const { fileIds, updates } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ success: false, message: 'fileIds array is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'updates object is required' });
    }

    // Build update query
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (['company_name', 'pn_name', 'work_detail', 'processing_status', 'quality_checks', 'ocr_text', 'receipt_date', 'total_amount'].includes(key)) {
        updateFields.push(`${key} = $${paramCounter++}`);
        queryParams.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    // Add processed_at if status is complete
    if (updates.processing_status === 'complete') {
      updateFields.push(`processed_at = NOW()`);
    }

    // Create placeholders for fileIds
    const idPlaceholders = fileIds.map((_, index) => `$${paramCounter + index}`).join(',');
    queryParams.push(...fileIds);

    const query = `UPDATE uploaded_files SET ${updateFields.join(', ')} WHERE id IN (${idPlaceholders}) RETURNING *`;
    const result = await db.query(query, queryParams);

    res.json({
      success: true,
      message: `Successfully updated ${result.rows.length} file(s)`,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Error in bulkUpdateFiles:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk update files: ' + error.message });
  }
};

// ✅ New Function: Search Files with Advanced Filters
exports.searchFiles = async (req, res) => {
  try {
    const { 
      q,                    // General search term
      company_name,
      pn_name,
      processing_status,
      quality_checks,
      date_from,
      date_to,
      page = 1,
      limit = 50,
      sort_by = 'uploaded_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const queryParams = [];
    let paramCounter = 1;

    // General search across multiple fields
    if (q) {
      conditions.push(`(
        uf.filename ILIKE $${paramCounter} OR 
        uf.company_name ILIKE $${paramCounter} OR 
        uf.pn_name ILIKE $${paramCounter} OR
        uf.ocr_text ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${q}%`);
      paramCounter++;
    }

    // Specific field filters
    if (company_name) { 
      conditions.push(`uf.company_name ILIKE $${paramCounter++}`); 
      queryParams.push(`%${company_name}%`); 
    }
    if (pn_name) { 
      conditions.push(`uf.pn_name ILIKE $${paramCounter++}`); 
      queryParams.push(`%${pn_name}%`); 
    }
    if (processing_status) { 
      conditions.push(`uf.processing_status = $${paramCounter++}`); 
      queryParams.push(processing_status); 
    }
    if (quality_checks) { 
      conditions.push(`uf.quality_checks = $${paramCounter++}`); 
      queryParams.push(quality_checks); 
    }

    // Date range filters
    if (date_from) {
      conditions.push(`uf.uploaded_at >= $${paramCounter++}`);
      queryParams.push(date_from);
    }
    if (date_to) {
      conditions.push(`uf.uploaded_at <= $${paramCounter++}`);
      queryParams.push(date_to + ' 23:59:59'); // Include full day
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Validate sort parameters
    const allowedSortFields = ['id', 'filename', 'company_name', 'pn_name', 'uploaded_at', 'processing_status'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'uploaded_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const orderClause = `ORDER BY uf.${sortField} ${sortDirection}`;
    const limitClause = `LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(parseInt(limit), offset);

    // Main query
    const query = `SELECT * FROM uploaded_files AS uf ${whereClause} ${orderClause} ${limitClause}`;
    const result = await db.query(query, queryParams);

    // Count query
    const countQuery = `SELECT COUNT(*) FROM uploaded_files AS uf ${whereClause}`;
    const countParams = queryParams.slice(0, queryParams.length - 2);
    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    res.json({
      success: true,
      data: result.rows,
      pagination: { 
        page: parseInt(page, 10), 
        limit: parseInt(limit, 10), 
        total: totalCount, 
        pages: Math.ceil(totalCount / limit) 
      },
      filters: { q, company_name, pn_name, processing_status, quality_checks, date_from, date_to },
      sort: { sort_by: sortField, sort_order: sortDirection }
    });
  } catch (error) {
    console.error('❌ Error in searchFiles:', error);
    res.status(500).json({ success: false, message: 'Failed to search files: ' + error.message });
  }
};

// ✅ New Function: Health Check
exports.healthCheck = async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    
    // Get basic system info
    const dbResult = await db.query('SELECT COUNT(*) as total_files FROM uploaded_files');
    const totalFiles = parseInt(dbResult.rows[0].total_files, 10);
    
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      total_files: totalFiles,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};