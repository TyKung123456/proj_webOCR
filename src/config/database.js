// src/config/database.js - Complete with addUploadedFile function and Thai support
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔄 Initializing database connection with Thai support...');

/** ✅ อ่าน ENV ได้ทั้งสองชุด + ค่าเริ่มต้นสำหรับ Docker network */
const runningInsideContainer = (() => {
  try {
    return fs.existsSync('/.dockerenv');
  } catch (err) {
    return false;
  }
})();

const DB_HOST =
  process.env.DB_HOST ||
  process.env.DB_POSTGRESDB_HOST ||
  (runningInsideContainer ? 'postgres' : 'localhost');

const DB_PORT = parseInt(
  process.env.DB_PORT ||
    process.env.DB_POSTGRESDB_PORT ||
    '5433',       // << พอร์ตภายในคอนเทนเนอร์ Postgres
  10
);

const DB_NAME =
  process.env.DB_NAME ||
  process.env.DB_POSTGRESDB_DATABASE ||
  'n8n';

const DB_USER =
  process.env.DB_USER ||
  process.env.DB_POSTGRESDB_USER ||
  'admin';

const DB_PASSWORD =
  process.env.DB_PASSWORD ||
  process.env.DB_POSTGRESDB_PASSWORD ||
  'P@ssw0rd';

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: false,
});

// log ค่าที่ใช้จริง (ลบได้ใน prod)
console.log('[DB CONFIG]', { host: DB_HOST, port: DB_PORT, database: DB_NAME, user: DB_USER });

pool.on('connect', async (client) => {
  try {
    console.log('🔗 Database connected successfully');
    await client.query("SET client_encoding TO 'UTF8'");
    const thaiTest = await client.query("SELECT 'สวัสดีครับ ทดสอบภาษาไทย 🇹🇭' as thai_text");
    console.log('🇹🇭 Thai support test:', thaiTest.rows[0].thai_text);

    const encodingCheck = await client.query('SHOW server_encoding');
    console.log('📊 Database encoding:', encodingCheck.rows[0].server_encoding);

    const clientEncodingCheck = await client.query('SHOW client_encoding');
    console.log('💻 Client encoding:', clientEncodingCheck.rows[0].client_encoding);

  } catch (error) {
    console.error('❌ Database Thai support test failed:', error.message);
  }
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  // The pool will automatically try to reconnect
});

pool.on('remove', (client) => {
  console.log('🔌 Client removed from pool');
});

// Test connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Initial database connection successful');
    client.release();
  } catch (err) {
    console.error('❌ Initial database connection failed:', err.message);
  }
})();

const MAX_DB_RETRIES = parseInt(process.env.DB_MAX_RETRIES || '3', 10);
const RETRYABLE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'PROTOCOL_CONNECTION_LOST', '57P01', '57P02', '57P03']);
const RETRYABLE_MESSAGES = [/terminat/i, /server closed the connection/i, /lost connection/i, /socket hang up/i];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetry = (error) => {
  if (!error) return false;
  if (error.code && RETRYABLE_CODES.has(error.code)) return true;
  const message = error.message || '';
  return RETRYABLE_MESSAGES.some(regex => regex.test(message));
};

const query = async (text, params) => {
  let attempt = 0;
  while (attempt < MAX_DB_RETRIES) {
    attempt += 1;
    try {
      if (attempt === 1 && process.env.NODE_ENV === 'development' && params) {
        params.forEach((param, index) => {
          if (typeof param === 'string' && /[\u0E00-\u0E7F]/.test(param)) {
            console.log(`🇹🇭 Thai parameter [${index}]:`, param);
          }
        });
      }
      return await pool.query(text, params);
    } catch (error) {
      if (error.message.includes('encoding') || error.message.includes('character')) {
        console.error('🇹🇭 Possible Thai encoding issue detected');
        console.error('💡 Suggestion: Check database and client encoding settings');
      }

      if (attempt >= MAX_DB_RETRIES || !shouldRetry(error)) {
        throw error;
      }

      const waitMs = Math.min(500 * attempt, 2000);
      console.warn(`⚠️ DB query failed (attempt ${attempt}/${MAX_DB_RETRIES}): ${error.message}. Retrying in ${waitMs}ms...`);
      await delay(waitMs);
    }
  }
};

// ฟังก์ชันเพิ่มไฟล์ใหม่พร้อมกำหนด similarity_status = 'pending'
const addUploadedFile = async (fileName) => {
  const insertQuery = `
    INSERT INTO uploaded_files (filename, similarity_status)
    VALUES ($1, 'pending')
    RETURNING *;
  `;
  try {
    const result = await pool.query(insertQuery, [fileName]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error inserting uploaded file:', error.message);
    throw error;
  }
};

const healthCheck = async () => {
  try {
    console.log('🏥 Running database health check...');

    const basicTest = await query('SELECT NOW() as current_time, version() as db_version');
    console.log('📅 Database time:', basicTest.rows[0].current_time);
    console.log('🗄️ Database version:', basicTest.rows[0].db_version.split(' ')[0]);

    const thaiTest = await query(`
      SELECT 
        'ทดสอบภาษาไทย' as thai_text,
        'ใบเสร็จรับเงิน' as receipt_text,
        'เอกสารสำคัญ' as document_text,
        '๑๒๓๔๕' as thai_numbers
    `);

    console.log('🇹🇭 Thai character test results:');
    console.log('   - Thai text:', thaiTest.rows[0].thai_text);
    console.log('   - Receipt text:', thaiTest.rows[0].receipt_text);
    console.log('   - Document text:', thaiTest.rows[0].document_text);
    console.log('   - Thai numbers:', thaiTest.rows[0].thai_numbers);

    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('uploaded_files', 'uploaded_files_page')
    `);

    console.log('📋 Available tables:');
    tableCheck.rows.forEach(row => console.log(`   - ${row.table_name} ✅`));

    if (tableCheck.rows.length < 2) {
      console.warn('⚠️ Warning: Some required tables are missing');
      console.warn('   Required: uploaded_files, uploaded_files_page');
    }

    return {
      success: true,
      connection: true,
      thai_support: true,
      tables: tableCheck.rows.map(r => r.table_name),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return {
      success: false,
      connection: false,
      thai_support: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing database with Thai language support...');
    const healthResult = await healthCheck();

    if (healthResult.success) {
      console.log('✅ Database initialization completed successfully');
      console.log('🇹🇭 Thai language support: ENABLED');
    } else {
      console.error('❌ Database initialization failed');
      throw new Error(healthResult.error);
    }
    return healthResult;

  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

const closeDatabase = async () => {
  try {
    console.log('🔄 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

module.exports = {
  query,
  pool,
  healthCheck,
  initializeDatabase,
  closeDatabase,
  addUploadedFile,
};

process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
