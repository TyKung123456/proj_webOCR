// src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { Ollama } = require('ollama');
const { Pool } = require('pg');
const axios = require('axios');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

/* ✅ CORS: แปลง ENV ให้เป็น array แล้ว "เลือก" origin ที่ร้องขอ */
const whitelist = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // อนุญาตกรณีไม่มี origin (curl/health-check)
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ รองรับ preflight

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static upload path
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health endpoints (คุณล็อกไว้ใน console แล้ว แต่ยังไม่มี route)
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/health/thai', (req, res) => res.json({ สถานะ: 'ปกติ' }));

// API route for file handling
app.use('/api', fileRoutes);

// ========== PostgreSQL & AI Chart ===========
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:7869';
const ollama = new Ollama({ host: OLLAMA_URL });

/* 🔎 หมายเหตุ ENV DB:
   ใน compose คุณใช้ DB_POSTGRESDB_HOST/PORT/... แต่ในโค้ดใช้ DB_HOST/DB_PORT/...
   ควรปรับให้ตรงกันด้านใดด้านหนึ่ง (ดูคำแนะนำด้านล่าง) */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'n8n',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
});

const DATABASE_SCHEMA = `
CREATE TABLE uploaded_files_page (
  id INT PRIMARY KEY,
  filename VARCHAR(255),
  owner VARCHAR(255),
  uploaded_at TIMESTAMP,
  total_amount VARCHAR(255),
  receipt_date VARCHAR(255),
  ocr_text TEXT,
  similarity_status VARCHAR(255),
  similarity_score NUMERIC,
  page_number INT,
  work_detail TEXT,
  client_ip VARCHAR(255)
);
`;

function formatDataForChart(rows, sqlQuery) {
  if (!rows || rows.length === 0) return { labels: [], datasets: [] };
  const labelKey = Object.keys(rows[0])[0];
  const dataKey = Object.keys(rows[0])[1];
  const datasetLabel = sqlQuery.match(/COUNT|SUM|AVG\((.*?)\)/i)?.[0] || 'ผลการวิเคราะห์';

  return {
    labels: rows.map(r => r[labelKey]),
    datasets: [{
      label: datasetLabel,
      data: rows.map(r => parseFloat(r[dataKey] || 0)),
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ],
      borderWidth: 1,
    }],
  };
}

app.post('/api/generate-chart', async (req, res) => {
  const { userQuery, model } = req.body;
  if (!userQuery) return res.status(400).json({ error: 'Query is required' });

  try {
    const prompt = `${DATABASE_SCHEMA}\nUser's request: "${userQuery}"\nJSON Response:`;
    const modelToUse = model || process.env.OLLAMA_MODEL || 'qwen:0.5b';

    const aiResponse = await ollama.chat({
      model: modelToUse,
      messages: [{ role: 'user', content: prompt }],
      format: 'json',
    });

    const parsedResponse = JSON.parse(aiResponse.message.content);
    const { sql, chartType } = parsedResponse;

    const dbResult = await pool.query(sql);
    const chartData = formatDataForChart(dbResult.rows, sql);

    res.json({ chartType, chartData });
  } catch (error) {
    console.error('❌ Error in /api/generate-chart:', error);
    let errorMessage = 'เกิดข้อผิดพลาดในการสื่อสารกับ AI หรือฐานข้อมูล';
    if (error.cause?.code === 'ECONNREFUSED') errorMessage = `ไม่สามารถเชื่อมต่อกับ AI Service ที่ ${OLLAMA_URL}`;
    if (error.message?.includes('not found')) errorMessage = `ไม่พบโมเดล "${model}" ในเครื่อง กรุณา pull โมเดลก่อน`;
    if (error.code === '42P01') errorMessage = 'ตารางหรือคอลัมน์ไม่ถูกต้อง โปรดตรวจสอบ DATABASE_SCHEMA';
    res.status(500).json({ error: errorMessage });
  }
});

// ====== Label Studio Integration ======
app.post('/api/send-to-labelstudio', async (req, res) => {
  const { fileUrl, fileName } = req.body;
  if (!fileUrl || !fileName) return res.status(400).json({ error: 'fileUrl and fileName are required' });

  try {
    const response = await axios.post(
      `${process.env.LABEL_STUDIO_URL || 'http://localhost:8080'}/api/projects/1/import`,
      [{ data: { image: fileUrl }, meta: { filename: fileName } }],
      { headers: { Authorization: `Token ${process.env.LABEL_STUDIO_TOKEN}` } }
    );

    res.json({ success: true, labelStudioResponse: response.data });
  } catch (err) {
    console.error('❌ Error sending to Label Studio:', err.message);
    res.status(500).json({ error: 'Failed to send to Label Studio' });
  }
});

// Fallback
app.get('/', (req, res) => res.json({ message: 'AI Chart API is running' }));
app.use('*', (req, res) => res.status(404).json({ message: 'Endpoint not found' }));

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  res.status(500).json({ error: 'Internal server error' });
});

/* ✅ ฟังทุกอินเทอร์เฟซในคอนเทนเนอร์ เพื่อให้ Docker map ออก host ได้ */
app.listen(PORT, '0.0.0.0', () => {
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
  console.log(`🚀 Server with AI Chart running on http://localhost:${PORT}`);
  console.log(`🤖 Connecting to AI Service at: ${OLLAMA_URL}`);
  console.log('================================');
});
