// src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { Ollama } = require('ollama');
const { Pool } = require('pg');
const fileRoutes = require('./routes/fileRoutes'); // สมมติว่าไฟล์นี้มีอยู่

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
const uploadsDir = path.join(__dirname, (process.env.UPLOAD_DIR || '../uploads'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes for Files
app.use('/api', fileRoutes);

// =================================================================
// AI Chart Generation Logic
// =================================================================

// 1. ตั้งค่าการเชื่อมต่อ AI Ollama
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:7869'; // ตัวอย่างค่าเริ่มต้น
const ollama = new Ollama({ host: OLLAMA_URL });

// 2. ตั้งค่าการเชื่อมต่อฐานข้อมูล PostgreSQL จาก .env
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'myprj_receipt',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
});

// 3. Schema ตาราง (ปรับให้ตรงกับฐานข้อมูลจริง)
const DATABASE_SCHEMA = `
You are an expert PostgreSQL data analyst.
Given the following database schema, write a SQL query to answer the user's request.
Your response MUST be a JSON object with two keys: "sql" containing only the SQL query string, and "chartType" containing the best chart type ('pie', 'bar', 'line').

Schema:
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

// 4. Helper function สำหรับจัดรูปแบบข้อมูล
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

// 5. API Endpoint สำหรับสร้างกราฟจากคำถามของผู้ใช้
app.post('/api/generate-chart', async (req, res) => {
  const { userQuery, model } = req.body;
  if (!userQuery) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const prompt = `${DATABASE_SCHEMA}\nUser's request: "${userQuery}"\nJSON Response:`;
    const modelToUse = model || process.env.OLLAMA_MODEL || 'qwen:0.5b';

    console.log(`🤖 Generating chart with model: ${modelToUse}`);

    const aiResponse = await ollama.chat({
      model: modelToUse,
      messages: [{ role: 'user', content: prompt }],
      format: 'json',
    });

    const parsedResponse = JSON.parse(aiResponse.message.content);
    const { sql, chartType } = parsedResponse;
    console.log('🤖 AI Generated SQL:', sql);

    const dbResult = await pool.query(sql);
    const chartData = formatDataForChart(dbResult.rows, sql);

    res.json({ chartType, chartData });

  } catch (error) {
    console.error('❌ Error in /api/generate-chart:', error);
    let errorMessage = 'เกิดข้อผิดพลาดในการสื่อสารกับ AI หรือฐานข้อมูล';
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      errorMessage = `ไม่สามารถเชื่อมต่อกับ AI Service ได้ที่ ${OLLAMA_URL}`;
    } else if (error.message && error.message.includes('not found')) {
      errorMessage = `ไม่พบโมเดล "${model}" ในเครื่อง กรุณาเลือกโมเดลอื่น หรือใช้คำสั่ง 'ollama pull ${model}'`;
    } else if (error.code === '42P01') {
      errorMessage = `เกิดข้อผิดพลาดในการ Query: ไม่พบตารางหรือคอลัมน์ในฐานข้อมูล โปรดตรวจสอบ DATABASE_SCHEMA`;
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Route ทั่วไป
app.get('/', (req, res) => {
  res.json({ message: 'AI Chart API is running' });
});
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// เริ่ม server
app.listen(PORT, () => {
  console.log(`🚀 Server with AI Chart running on http://localhost:${PORT}`);
  console.log(`🤖 Connecting to AI Service at: ${OLLAMA_URL}`);
});
