// src/config/database.js - Updated with Thai Language Support
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔄 Initializing database connection with Thai support...');

// ✅ Database configuration with UTF-8 support (based on existing config)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'myprj_receipt',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
  
  // ✅ Keep existing settings
  max: 10,
  idleTimeoutMillis: 30000,
  
  // ✅ Add Thai language support settings
  charset: 'utf8',
  client_encoding: 'UTF8'
});

// ✅ Test Thai character support on connection
pool.on('connect', async (client) => {
  try {
    console.log('🔗 Database connected successfully');
    
    // Set client encoding to UTF-8
    await client.query("SET client_encoding TO 'UTF8'");
    
    // Test Thai character support
    const thaiTest = await client.query("SELECT 'สวัสดีครับ ทดสอบภาษาไทย 🇹🇭' as thai_text");
    console.log('🇹🇭 Thai support test:', thaiTest.rows[0].thai_text);
    
    // Check database encoding
    const encodingCheck = await client.query('SHOW server_encoding');
    console.log('📊 Database encoding:', encodingCheck.rows[0].server_encoding);
    
    const clientEncodingCheck = await client.query('SHOW client_encoding');
    console.log('💻 Client encoding:', clientEncodingCheck.rows[0].client_encoding);
    
  } catch (error) {
    console.error('❌ Database Thai support test failed:', error.message);
  }
});

// ✅ Error handling
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
});

// ✅ Enhanced query function with Thai support (keeping existing interface)
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    // Log parameters if they contain Thai characters (only in development)
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
    // Check if it's an encoding-related error
    if (error.message.includes('encoding') || error.message.includes('character')) {
      console.error('🇹🇭 Possible Thai encoding issue detected');
      console.error('💡 Suggestion: Check database and client encoding settings');
    }
    
    throw error;
  }
};

// ✅ Database health check with Thai support test
const healthCheck = async () => {
  try {
    console.log('🏥 Running database health check...');
    
    // Basic connection test
    const basicTest = await query('SELECT NOW() as current_time, version() as db_version');
    console.log('📅 Database time:', basicTest.rows[0].current_time);
    console.log('🗄️ Database version:', basicTest.rows[0].db_version.split(' ')[0]);
    
    // Thai character test
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
    
    // Check if tables exist
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

// ✅ Initialize database with Thai support verification
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

// ✅ Graceful shutdown
const closeDatabase = async () => {
  try {
    console.log('🔄 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Export functions
module.exports = {
  query,
  pool,
  healthCheck,
  initializeDatabase,
  closeDatabase
};

// ✅ Handle process termination
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);