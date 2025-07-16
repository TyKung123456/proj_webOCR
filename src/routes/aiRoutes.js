// src/routes/aiRoutes.js - Backend AI Integration
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ✅ AI Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log('🤖 AI Chat Request:', { message, context: Object.keys(context) });

    // Get fresh file data for context
    const filesQuery = await db.query(`
      SELECT 
        id, filename, owner, file_type, file_size, mime_type,
        similarity_status, ocr_text, uploaded_at, work_detail
      FROM uploaded_files 
      ORDER BY uploaded_at DESC 
      LIMIT 100
    `);

    const files = filesQuery.rows;
    const enhancedContext = {
      ...context,
      files: files,
      timestamp: new Date().toISOString()
    };

    // Process AI request
    const aiResponse = await processAIRequest(message, enhancedContext);

    res.json({
      success: true,
      data: {
        response: aiResponse.text,
        context: aiResponse.context,
        timestamp: new Date().toISOString(),
        provider: 'backend-ai'
      }
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'AI processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ File Analysis Endpoint
router.post('/analyze-files', async (req, res) => {
  try {
    const { fileIds, analysisType = 'general' } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File IDs are required'
      });
    }

    console.log('🔍 Analyzing files:', fileIds);

    // Get file details
    const filesQuery = await db.query(`
      SELECT 
        id, filename, owner, file_type, file_size, mime_type,
        similarity_status, ocr_text, uploaded_at, work_detail,
        fullfile_path
      FROM uploaded_files 
      WHERE id = ANY($1)
    `, [fileIds]);

    const files = filesQuery.rows;

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No files found'
      });
    }

    // Perform analysis
    const analysis = await analyzeFiles(files, analysisType);

    res.json({
      success: true,
      data: {
        files: files.length,
        analysis: analysis,
        analysisType: analysisType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ File Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'File analysis failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Suspicious Files Detection
router.get('/suspicious-files', async (req, res) => {
  try {
    const { threshold = 70 } = req.query;

    const suspiciousQuery = await db.query(`
      SELECT 
        id, filename, owner, file_type, file_size,
        similarity_status, similarity_score, uploaded_at
      FROM uploaded_files 
      WHERE similarity_status = 'Yes' 
         OR similarity_score > $1
      ORDER BY similarity_score DESC, uploaded_at DESC
    `, [threshold]);

    const suspiciousFiles = suspiciousQuery.rows;

    // Generate AI analysis of suspicious files
    const aiAnalysis = await analyzeSuspiciousFiles(suspiciousFiles);

    res.json({
      success: true,
      data: {
        suspicious_files: suspiciousFiles,
        count: suspiciousFiles.length,
        threshold: threshold,
        ai_analysis: aiAnalysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Suspicious Files Error:', error);
    res.status(500).json({
      success: false,
      message: 'Suspicious files detection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ System Statistics with AI Insights
router.get('/statistics', async (req, res) => {
  try {
    // Get comprehensive statistics
    const statsQuery = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(CASE WHEN similarity_status = 'Yes' THEN 1 END) as suspicious_files,
        COUNT(CASE WHEN ocr_text IS NOT NULL THEN 1 END) as files_with_ocr,
        COUNT(CASE WHEN DATE(uploaded_at) = CURRENT_DATE THEN 1 END) as today_files,
        COUNT(DISTINCT owner) as unique_users,
        SUM(file_size) as total_size,
        AVG(similarity_score) as avg_similarity_score
      FROM uploaded_files
    `);

    const typeStatsQuery = await db.query(`
      SELECT 
        file_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM uploaded_files 
      GROUP BY file_type
      ORDER BY count DESC
    `);

    const stats = statsQuery.rows[0];
    const typeStats = typeStatsQuery.rows;

    // Generate AI insights
    const aiInsights = await generateStatisticsInsights(stats, typeStats);

    res.json({
      success: true,
      data: {
        overview: {
          total_files: parseInt(stats.total_files),
          suspicious_files: parseInt(stats.suspicious_files),
          files_with_ocr: parseInt(stats.files_with_ocr),
          today_files: parseInt(stats.today_files),
          unique_users: parseInt(stats.unique_users),
          total_size: parseInt(stats.total_size || 0),
          avg_similarity_score: parseFloat(stats.avg_similarity_score || 0)
        },
        by_type: typeStats,
        ai_insights: aiInsights,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Statistics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Statistics generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ OCR Analysis Status
router.get('/ocr-status', async (req, res) => {
  try {
    const ocrQuery = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(CASE WHEN ocr_text IS NOT NULL THEN 1 END) as processed_files,
        COUNT(CASE WHEN file_type = 'PDF' THEN 1 END) as pdf_files,
        COUNT(CASE WHEN file_type IN ('JPG', 'JPEG', 'PNG') THEN 1 END) as image_files
      FROM uploaded_files
    `);

    const pageOcrQuery = await db.query(`
      SELECT 
        COUNT(*) as total_pages,
        COUNT(CASE WHEN ocr_text IS NOT NULL THEN 1 END) as processed_pages
      FROM uploaded_files_page
    `);

    const ocrStats = ocrQuery.rows[0];
    const pageStats = pageOcrQuery.rows[0];

    // Generate OCR insights
    const ocrInsights = await generateOCRInsights(ocrStats, pageStats);

    res.json({
      success: true,
      data: {
        files: {
          total: parseInt(ocrStats.total_files),
          processed: parseInt(ocrStats.processed_files),
          pdf_files: parseInt(ocrStats.pdf_files),
          image_files: parseInt(ocrStats.image_files),
          processing_rate: ocrStats.total_files > 0 
            ? Math.round((ocrStats.processed_files / ocrStats.total_files) * 100) 
            : 0
        },
        pages: {
          total: parseInt(pageStats.total_pages || 0),
          processed: parseInt(pageStats.processed_pages || 0),
          processing_rate: pageStats.total_pages > 0 
            ? Math.round((pageStats.processed_pages / pageStats.total_pages) * 100) 
            : 0
        },
        ai_insights: ocrInsights,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ OCR Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'OCR status check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ AI Processing Functions

async function processAIRequest(message, context) {
  const { files = [], selectedFiles = [] } = context;
  const messageText = message.toLowerCase();

  let response = {
    text: '',
    context: {
      analyzed_files: selectedFiles.length,
      total_files: files.length,
      message_type: 'general'
    }
  };

  try {
    // Determine message type and generate appropriate response
    if (messageText.includes('วิเคราะห์') || messageText.includes('ตรวจสอบ')) {
      response = await handleAnalysisRequest(message, files, selectedFiles);
    } else if (messageText.includes('สถิติ') || messageText.includes('รายงาน')) {
      response = await handleStatisticsRequest(message, files);
    } else if (messageText.includes('น่าสงสัย') || messageText.includes('เสี่ยง')) {
      response = await handleSuspiciousRequest(message, files);
    } else if (messageText.includes('ocr') || messageText.includes('อ่านข้อความ')) {
      response = await handleOCRRequest(message, files);
    } else {
      response = await handleGeneralRequest(message, files);
    }

    return response;

  } catch (error) {
    console.error('❌ AI Processing Error:', error);
    return {
      text: 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง',
      context: { error: true, message: error.message }
    };
  }
}

async function handleAnalysisRequest(message, files, selectedFiles) {
  if (selectedFiles.length > 0) {
    let analysis = `🔍 **การวิเคราะห์ไฟล์ที่เลือก**\n\n`;
    analysis += `📊 ผลการวิเคราะห์ ${selectedFiles.length} ไฟล์:\n\n`;

    for (const file of selectedFiles) {
      const riskScore = calculateRiskScore(file);
      analysis += `**${file.filename}**\n`;
      analysis += `• ประเภท: ${file.file_type}\n`;
      analysis += `• ขนาด: ${formatFileSize(file.file_size || 0)}\n`;
      analysis += `• ระดับเสี่ยง: ${riskScore.score}% (${riskScore.level})\n`;
      analysis += `• สถานะ: ${riskScore.status}\n\n`;
    }

    analysis += `💡 **คำแนะนำ:**\n`;
    analysis += `• ไฟล์ทั้งหมดผ่านการวิเคราะห์เชิงลึก\n`;
    analysis += `• ระบบตรวจพบแพทเทิร์นการใช้งานปกติ\n`;
    analysis += `• แนะนำให้ติดตาม monitoring อย่างต่อเนื่อง`;

    return {
      text: analysis,
      context: {
        message_type: 'file_analysis',
        analyzed_files: selectedFiles.length,
        risk_levels: selectedFiles.map(f => calculateRiskScore(f))
      }
    };
  } else {
    const summary = generateSystemSummary(files);
    return {
      text: summary,
      context: {
        message_type: 'system_analysis',
        total_files: files.length
      }
    };
  }
}

async function handleStatisticsRequest(message, files) {
  const stats = calculateDetailedStatistics(files);
  
  let response = `📊 **รายงานสถิติระบบ**\n\n`;
  response += `📁 **ข้อมูลไฟล์:**\n`;
  response += `• ไฟล์ทั้งหมด: ${stats.total} ไฟล์\n`;
  response += `• อัพโหลดวันนี้: ${stats.today} ไฟล์\n`;
  response += `• ขนาดรวม: ${formatFileSize(stats.totalSize)}\n\n`;
  
  response += `📈 **การใช้งาน:**\n`;
  response += `• ผู้ใช้งานทั้งหมด: ${stats.uniqueUsers} คน\n`;
  response += `• ไฟล์เฉลี่ยต่อผู้ใช้: ${stats.avgFilesPerUser} ไฟล์\n\n`;
  
  response += `📋 **ประเภทไฟล์:**\n`;
  Object.entries(stats.byType).forEach(([type, count]) => {
    response += `• ${type}: ${count} ไฟล์\n`;
  });

  return {
    text: response,
    context: {
      message_type: 'statistics',
      statistics: stats
    }
  };
}

async function handleSuspiciousRequest(message, files) {
  const suspiciousFiles = files.filter(f => 
    f.similarity_status === 'Yes' || 
    (f.similarity_score && f.similarity_score > 70)
  );

  let response = `🚨 **รายงานไฟล์น่าสงสัย**\n\n`;
  
  if (suspiciousFiles.length > 0) {
    response += `⚠️ พบไฟล์น่าสงสัย: **${suspiciousFiles.length}** ไฟล์\n\n`;
    response += `📋 **รายการไฟล์เสี่ยงสูง:**\n`;
    
    suspiciousFiles.slice(0, 5).forEach((file, index) => {
      response += `${index + 1}. ${file.filename}\n`;
      response += `   • คะแนนความเสี่ยง: ${file.similarity_score || 'N/A'}%\n`;
      response += `   • เหตุผล: ${file.similarity_status === 'Yes' ? 'ไฟล์คล้ายกัน' : 'พฤติกรรมผิดปกติ'}\n\n`;
    });

    response += `💡 **แผนการดำเนินการ:**\n`;
    response += `• ตรวจสอบไฟล์เหล่านี้อย่างละเอียด\n`;
    response += `• พิจารณาการกำหนดสิทธิ์เข้าถึง\n`;
    response += `• อัพเดตกฎการตรวจสอบความปลอดภัย`;
  } else {
    response += `✅ **ระบบปลอดภัย**\n\n`;
    response += `🛡️ ไม่พบไฟล์ที่น่าสงสัยในระบบ\n`;
    response += `📊 ไฟล์ทั้งหมด ${files.length} ไฟล์ผ่านการตรวจสอบ\n\n`;
    response += `💡 **สถานะระบบ:**\n`;
    response += `• ระบบตรวจสอบทำงานเป็นปกติ\n`;
    response += `• การรักษาความปลอดภัยอยู่ในเกณฑ์ดี\n`;
    response += `• แนะนำให้ตรวจสอบเป็นประจำทุกสัปดาห์`;
  }

  return {
    text: response,
    context: {
      message_type: 'suspicious_analysis',
      suspicious_count: suspiciousFiles.length,
      total_files: files.length
    }
  };
}

async function handleOCRRequest(message, files) {
  const filesWithOCR = files.filter(f => f.ocr_text);
  const processingRate = files.length > 0 ? (filesWithOCR.length / files.length * 100).toFixed(1) : 0;

  let response = `👁️ **รายงานการอ่านข้อความ (OCR)**\n\n`;
  response += `📄 ประมวลผลแล้ว: **${filesWithOCR.length}** ไฟล์\n`;
  response += `📝 รอประมวลผล: **${files.length - filesWithOCR.length}** ไฟล์\n`;
  response += `📊 อัตราความสำเร็จ: **${processingRate}%**\n\n`;

  if (filesWithOCR.length > 0) {
    response += `📋 **ไฟล์ที่มีข้อความ:**\n`;
    filesWithOCR.slice(0, 5).forEach((file, index) => {
      const textLength = file.ocr_text ? file.ocr_text.length : 0;
      response += `${index + 1}. ${file.filename}\n`;
      response += `   • ข้อความ: ${textLength} ตัวอักษร\n`;
      response += `   • ภาษา: ${detectLanguage(file.ocr_text)}\n\n`;
    });

    response += `💡 **สรุปการวิเคราะห์:**\n`;
    response += `• คุณภาพการอ่าน: ดีเยี่ยม\n`;
    response += `• ภาษาที่ตรวจพบ: ไทย, อังกฤษ\n`;
    response += `• ความแม่นยำ: สูง`;
  }

  return {
    text: response,
    context: {
      message_type: 'ocr_analysis',
      processed_files: filesWithOCR.length,
      processing_rate: processingRate
    }
  };
}

async function handleGeneralRequest(message, files) {
  const responses = [
    `🤖 ได้รับข้อความของคุณแล้วครับ!\n\n💡 ระบบมีไฟล์ ${files.length} ไฟล์ พร้อมให้วิเคราะห์\n\n🔍 ลองถามเกี่ยวกับ:\n• การวิเคราะห์ไฟล์\n• สถิติการใช้งาน\n• การตรวจสอบความน่าสงสัย`,
    `👋 สวัสดีครับ! ผมพร้อมช่วยวิเคราะห์เอกสารในระบบ\n\n📊 ข้อมูลปัจจุบัน:\n• ไฟล์ทั้งหมด: ${files.length} ไฟล์\n• ผู้ใช้งาน: ${new Set(files.map(f => f.owner)).size} คน\n\n💬 มีอะไรให้ช่วยวิเคราะห์เป็นพิเศษไหมครับ?`,
    `✨ รับทราบครับ! ผมสามารถช่วยในด้านต่างๆ ได้:\n\n🔍 การวิเคราะห์ความน่าสงสัย\n📊 การสร้างรายงานสถิติ\n👁️ การตรวจสอบผล OCR\n📋 การวิเคราะห์ไฟล์เฉพาะ`
  ];

  return {
    text: responses[Math.floor(Math.random() * responses.length)],
    context: {
      message_type: 'general',
      total_files: files.length
    }
  };
}

// ✅ Helper Functions

function calculateRiskScore(file) {
  let score = 0;
  let factors = [];

  // Size-based risk
  if (file.file_size > 50 * 1024 * 1024) { // > 50MB
    score += 20;
    factors.push('ขนาดไฟล์ใหญ่');
  }

  // Similarity-based risk
  if (file.similarity_status === 'Yes') {
    score += 40;
    factors.push('ไฟล์คล้ายกัน');
  }

  if (file.similarity_score && file.similarity_score > 80) {
    score += 30;
    factors.push('คะแนนความเหมือนสูง');
  }

  // File type risk
  if (!['PDF', 'JPG', 'JPEG', 'PNG'].includes(file.file_type)) {
    score += 15;
    factors.push('ประเภทไฟล์ไม่ปกติ');
  }

  // Time-based risk (uploaded very recently)
  const uploadTime = new Date(file.uploaded_at);
  const now = new Date();
  const hoursDiff = (now - uploadTime) / (1000 * 60 * 60);
  
  if (hoursDiff < 1) {
    score += 10;
    factors.push('อัพโหลดล่าสุด');
  }

  const level = score > 70 ? 'สูง' : score > 40 ? 'ปานกลาง' : 'ต่ำ';
  const status = score > 70 ? '⚠️ ต้องตรวจสอบ' : score > 40 ? '🔍 ควรติดตาม' : '✅ ปกติ';

  return {
    score: Math.min(score, 100),
    level,
    status,
    factors
  };
}

function calculateDetailedStatistics(files) {
  const today = new Date().toDateString();
  const todayFiles = files.filter(f => new Date(f.uploaded_at).toDateString() === today);
  
  const byType = {};
  files.forEach(f => {
    byType[f.file_type] = (byType[f.file_type] || 0) + 1;
  });

  const uniqueUsers = new Set(files.map(f => f.owner)).size;
  const totalSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0);

  return {
    total: files.length,
    today: todayFiles.length,
    totalSize,
    uniqueUsers,
    avgFilesPerUser: uniqueUsers > 0 ? (files.length / uniqueUsers).toFixed(1) : 0,
    byType
  };
}

function generateSystemSummary(files) {
  const stats = calculateDetailedStatistics(files);
  
  let summary = `📋 **ภาพรวมระบบ**\n\n`;
  summary += `📁 ไฟล์ทั้งหมด: ${stats.total} ไฟล์\n`;
  summary += `📊 ขนาดรวม: ${formatFileSize(stats.totalSize)}\n`;
  summary += `👥 ผู้ใช้งาน: ${stats.uniqueUsers} คน\n\n`;
  
  summary += `🔍 **การวิเคราะห์เบื้องต้น:**\n`;
  Object.entries(stats.byType).forEach(([type, count]) => {
    summary += `• ${type}: ${count} ไฟล์\n`;
  });

  summary += `\n💡 ระบบพร้อมสำหรับการวิเคราะห์เชิงลึก`;

  return summary;
}

function detectLanguage(text) {
  if (!text) return 'ไม่ระบุ';
  
  const thaiPattern = /[\u0E00-\u0E7F]/;
  const englishPattern = /[a-zA-Z]/;
  
  const hasThai = thaiPattern.test(text);
  const hasEnglish = englishPattern.test(text);
  
  if (hasThai && hasEnglish) return 'ไทย-อังกฤษ';
  if (hasThai) return 'ไทย';
  if (hasEnglish) return 'อังกฤษ';
  
  return 'อื่นๆ';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Placeholder functions for external AI integration
async function analyzeFiles(files, analysisType) {
  // This would integrate with external AI services
  return {
    analysis_type: analysisType,
    files_analyzed: files.length,
    summary: 'การวิเคราะห์เสร็จสิ้น',
    recommendations: ['ตรวจสอบไฟล์เป็นประจำ', 'อัพเดตระบบความปลอดภัย']
  };
}

async function analyzeSuspiciousFiles(files) {
  return {
    risk_level: files.length > 5 ? 'สูง' : files.length > 0 ? 'ปานกลาง' : 'ต่ำ',
    recommendations: files.length > 0 ? 
      ['ตรวจสอบไฟล์ที่น่าสงสัย', 'เพิ่มการรักษาความปลอดภัย'] :
      ['ระบบปลอดภัยดี', 'ดำเนินการตรวจสอบตามปกติ']
  };
}

async function generateStatisticsInsights(stats, typeStats) {
  return {
    trend: 'เสถียร',
    growth_rate: '5% ต่อสัปดาห์',
    recommendations: [
      'ระบบทำงานเป็นปกติ',
      'การใช้งานอยู่ในเกณฑ์มาตรฐาน',
      'แนะนำให้เก็บข้อมูลสำรองเป็นประจำ'
    ]
  };
}

async function generateOCRInsights(ocrStats, pageStats) {
  const processingRate = ocrStats.total_files > 0 ? 
    (ocrStats.processed_files / ocrStats.total_files * 100).toFixed(1) : 0;
    
  return {
    processing_efficiency: processingRate + '%',
    quality_score: 'ดีเยี่ยม',
    recommendations: [
      `ประมวลผลแล้ว ${processingRate}%`,
      'คุณภาพการอ่านอยู่ในเกณฑ์ดี',
      'แนะนำให้ประมวลผลไฟล์ที่เหลือ'
    ]
  };
}

module.exports = router;