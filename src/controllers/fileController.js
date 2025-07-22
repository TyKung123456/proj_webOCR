const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Pool } = require('pg');

// --- Database Connection ---
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'myprj_receipt',
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

        const result = await db.query(
          `INSERT INTO uploaded_files (filename, owner, work_detail, uploaded_at, client_ip, fullfile_path, folder_timestamp, similarity_status, company_name, pn_name, file_size, file_type, processing_status) 
           VALUES ($1, $2, $3, NOW(), $4, $5, $6, 'No', $7, $8, $9, $10, 'pending') RETURNING *`,
          [originalFilename, owner, workDetail, clientIp, fullFilePath, folderTimestamp, company_name, pn_name, size, mimetype]
        );
        const savedFile = result.rows[0];

        if (file.mimetype === 'application/pdf') {
          await db.query(
            `INSERT INTO uploaded_files_page(file_id, filename, owner, work_detail, uploaded_at, client_ip, fullfile_path, folder_timestamp, page_number, similarity_status) 
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [savedFile.id, originalFilename, owner, workDetail, savedFile.uploaded_at, clientIp, fullFilePath, folderTimestamp, 1, 'No']
          );
        }

        const backupFilePath = path.join(backupDir, path.basename(file.path));
        fs.copyFileSync(fullFilePath, backupFilePath);
        uploadedFilesResult.push({ id: savedFile.id, filename: originalFilename });

      } catch (fileError) {
        console.error(`❌ Error processing file ${file.originalname}:`, fileError);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }
    res.status(201).json({ success: true, message: `Successfully uploaded ${uploadedFilesResult.length} file(s).`, data: uploadedFilesResult });
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
    if (quality_check) { conditions.push(`uf.quality_check = $${paramCounter++}`); queryParams.push(quality_check); }

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

exports.getCompanyStatistics = async (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
};