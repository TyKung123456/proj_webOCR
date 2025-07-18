// src/config/database.js - Complete with addUploadedFile function and Thai support
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔄 Initializing database connection with Thai support...');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'myprj_receipt',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',

  max: 10,
  idleTimeoutMillis: 30000,

  // pg client doesn't officially support charset here, but setting client_encoding on connect is enough
  // charset: 'utf8',  // ไม่จำเป็นต้องใส่ใน pool config
  // client_encoding: 'UTF8'
});

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
  console.error('❌ Unexpected error on idle client:', err);
});

const query = async (text, params) => {
  const start = Date.now();

  try {
    if (process.env.NODE_ENV === 'development' && params) {
      params.forEach((param, index) => {
        if (typeof param === 'string' && /[\u0E00-\u0E7F]/.test(param)) {
          console.log(`🇹🇭 Thai parameter [${index}]:`, param);
        }
      });
    }

    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    if (error.message.includes('encoding') || error.message.includes('character')) {
      console.error('🇹🇭 Possible Thai encoding issue detected');
      console.error('💡 Suggestion: Check database and client encoding settings');
    }
    throw error;
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
    tableCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name} ✅`);
    });

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

// Export all needed functions
module.exports = {
  query,
  pool,
  healthCheck,
  initializeDatabase,
  closeDatabase,
  addUploadedFile,
};

// Handle termination signals
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
