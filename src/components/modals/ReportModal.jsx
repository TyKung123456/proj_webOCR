// src/components/modals/ReportModal.jsx - Enhanced Version with Chart.js and File List
import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

// ✨ NEW: Import Chart.js components and register elements
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

// ✨ NEW: Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);


const ReportModal = ({
  onClose,
  reportType,
  setReportType,
  reportDescription,
  setReportDescription,
  files = []
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedChart, setGeneratedChart] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [aiStatus, setAiStatus] = useState('ready');

  const chartContainerRef = useRef(null);

  const OLLAMA_BASE_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:11434';

  const chartTypes = [
    { id: 'pie', name: 'Pie Chart', description: 'แสดงสัดส่วนประเภทเอกสาร', icon: '🥧' },
    { id: 'doughnut', name: 'Donut Chart', description: 'แสดงสัดส่วนแบบโดนัท', icon: '🍩' },
    { id: 'bar', name: 'Bar Chart', description: 'เปรียบเทียบจำนวนเอกสาร', icon: '📊' },
    { id: 'line', name: 'Line Chart', description: 'แสดงแนวโน้มตามเวลา', icon: '📈' },
  ];

  useEffect(() => {
    fetchOllamaModels();
  }, []);

  const fetchOllamaModels = async () => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        if (data.models) {
          setAvailableModels(data.models);
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].name);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setAiStatus('error');
    }
  };

  const getRecommendedChart = (description) => {
    const lower = description.toLowerCase();
    if (lower.includes('สัดส่วน') || lower.includes('เปอร์เซ็นต์')) return 'pie';
    if (lower.includes('เปรียบเทียบ') || lower.includes('จำนวน')) return 'bar';
    if (lower.includes('แนวโน้ม') || lower.includes('trend')) return 'line';
    return 'bar';
  };

  const recommended = reportDescription ? getRecommendedChart(reportDescription) : null;

  const analyzeFilesData = () => {
    const analysis = {
      totalFiles: files.length,
      fileTypes: {},
      suspiciousFiles: files.filter(f => f.is_suspicious || f.similarity_status === 'Yes').length,
      ocrFiles: files.filter(f => f.has_ocr || f.ocr_text).length,
      owners: [...new Set(files.map(f => f.owner).filter(Boolean))],
    };
    files.forEach(file => {
      const type = file.file_type || 'Unknown';
      analysis.fileTypes[type] = (analysis.fileTypes[type] || 0) + 1;
    });
    return analysis;
  };

  // ✅ CHANGED: Updated to create data compatible with Chart.js
  const createFallbackChartData = (dataAnalysis, chartType) => {
    const labels = Object.keys(dataAnalysis.fileTypes);
    const data = Object.values(dataAnalysis.fileTypes);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

    let chartData;
    let title = 'กราฟแสดงข้อมูล';

    switch (chartType) {
      case 'pie':
      case 'doughnut':
        chartData = {
          labels,
          datasets: [{
            label: 'จำนวนไฟล์',
            data,
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
          }],
        };
        title = 'สัดส่วนประเภทไฟล์';
        break;
      
      case 'line':
        chartData = {
            labels,
            datasets: [{
                label: 'จำนวนไฟล์',
                data,
                fill: false,
                borderColor: '#3b82f6',
                tension: 0.1,
            }]
        }
        title = 'แนวโน้มไฟล์แต่ละประเภท'
        break;

      case 'bar':
      default:
        chartData = {
          labels,
          datasets: [{
            label: 'จำนวนไฟล์',
            data,
            backgroundColor: colors,
          }],
        };
        title = 'จำนวนไฟล์แต่ละประเภท';
        break;
    }

    return {
      chartData,
      chartConfig: { title, xLabel: 'ประเภท', yLabel: 'จำนวน' },
      analysis: {
        summary: `สร้างจากข้อมูลสำรอง (Fallback) เนื่องจาก AI ไม่ตอบสนอง\nวิเคราะห์ไฟล์ทั้งหมด ${dataAnalysis.totalFiles} ไฟล์`,
        insights: [
          `ประเภทไฟล์ที่พบมากที่สุดคือ ${Object.entries(dataAnalysis.fileTypes).sort(([, a], [, b]) => b - a)[0]?.[0] || 'ไม่ทราบ'}`,
          `มีผู้อัพโหลดทั้งหมด ${dataAnalysis.owners.length} คน`,
          `อัตราไฟล์น่าสงสัย: ${dataAnalysis.totalFiles > 0 ? Math.round((dataAnalysis.suspiciousFiles / dataAnalysis.totalFiles) * 100) : 0}%`,
        ],
        recommendations: [ 'ควรตรวจสอบไฟล์น่าสงสัยเพิ่มเติม', 'ควรมีการสำรองข้อมูลเป็นประจำ' ],
      },
    };
  };

  const generateChartWithAI = async () => {
    if (!selectedModel || !reportDescription.trim()) {
      alert('กรุณาเลือกโมเดล AI และใส่คำอธิบาย');
      return;
    }
    setIsGenerating(true);
    setGeneratedChart(false);
    setAiStatus('thinking');

    try {
      const dataAnalysis = analyzeFilesData();
      
      // ✅ CHANGED: Updated the AI prompt to request a Chart.js-compatible JSON structure.
      const prompt = `You are a data analysis expert. Analyze the following file data and generate a chart configuration in JSON format compatible with Chart.js.

File Data Summary:
- Total Files: ${dataAnalysis.totalFiles}
- File Types: ${JSON.stringify(dataAnalysis.fileTypes)}
- Suspicious Files: ${dataAnalysis.suspiciousFiles}
- Files with OCR: ${dataAnalysis.ocrFiles}

User's Request: "${reportDescription}"
Requested Chart Type: "${reportType}"

Please provide a JSON response with the following structure. The 'chartData' object must be compatible with Chart.js:
{
  "chartData": {
    "labels": ["PDF", "PNG", "DOCX"],
    "datasets": [{
      "label": "Number of Files",
      "data": [15, 10, 5],
      "backgroundColor": ["#3b82f6", "#10b981", "#f59e0b"]
    }]
  },
  "chartConfig": {
    "title": "Analysis of Document Types",
    "xLabel": "File Type",
    "yLabel": "Count"
  },
  "analysis": {
    "summary": "A brief summary of the findings.",
    "insights": ["Insight 1.", "Insight 2."],
    "recommendations": ["Recommendation 1.", "Recommendation 2."]
  }
}`;

      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            prompt: prompt,
            stream: false,
            format: "json",
            options: { temperature: 0.1 }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.response) {
            const aiResult = JSON.parse(data.response);
            if (aiResult.chartData && aiResult.chartData.labels && aiResult.chartData.datasets) {
              setAnalysisResult(aiResult);
              setGeneratedChart(true);
              setAiStatus('ready');
              setIsGenerating(false);
              return; // Success, exit function
            }
          }
        }
      } catch (aiError) {
        console.warn('AI generation failed, using fallback. Error:', aiError);
      }

      // Fallback if AI fails
      const fallbackResult = createFallbackChartData(dataAnalysis, reportType);
      setAnalysisResult(fallbackResult);
      setGeneratedChart(true);
      setAiStatus('ready');

    } catch (error) {
      console.error('Chart generation process error:', error);
      setAiStatus('error');
      alert(`เกิดข้อผิดพลาดในการสร้างกราฟ: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (chartContainerRef.current) {
      html2canvas(chartContainerRef.current, { backgroundColor: '#ffffff' })
        .then(canvas => {
          const image = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.href = image;
          link.download = `chart-${reportType}-${Date.now()}.png`;
          link.click();
        });
    }
  };

  // ✅ CHANGED: Replaced custom chart components with react-chartjs-2
  const renderChart = () => {
    if (!generatedChart || !analysisResult?.chartData) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">พร้อมสร้างกราฟ</p>
            <p className="text-sm">เลือกประเภทและคลิก "สร้างกราฟด้วย AI"</p>
          </div>
        </div>
      );
    }

    const { chartData, chartConfig } = analysisResult;
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: chartConfig?.title || 'Chart' },
      },
    };

    switch (reportType) {
      case 'pie': return <Pie data={chartData} options={options} />;
      case 'doughnut': return <Doughnut data={chartData} options={options} />;
      case 'line': return <Line data={chartData} options={options} />;
      case 'bar': default: return <Bar data={chartData} options={options} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full shadow-2xl flex flex-col" style={{ maxHeight: '95vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🤖 AI Chart Generator
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><span className="text-xl text-gray-500">✕</span></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel */}
            <div className="flex flex-col space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🤖 เลือกโมเดล AI</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">เลือกโมเดล...</option>
                  {availableModels.map(model => (<option key={model.name} value={model.name}>{model.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 อธิบายสิ่งที่ต้องการวิเคราะห์</label>
                <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none" rows="3" placeholder="เช่น แสดงสัดส่วนประเภทเอกสาร..." />
              </div>
              
              {/* ✨ NEW: File List Section */}
              <div className="border border-gray-200 rounded-lg flex-1 flex flex-col min-h-0">
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <h4 className="font-medium text-gray-800">
                          📁 ไฟล์ที่จะวิเคราะห์ ({files.length} รายการ)
                      </h4>
                  </div>
                  <div className="overflow-y-auto p-3 space-y-2 bg-white">
                      {files.length > 0 ? files.map(file => (
                          <div key={file.id} className="text-xs text-gray-700 truncate p-1 bg-gray-50 rounded">
                             • {file.original_name || file.filename} ({file.file_type})
                          </div>
                      )) : (
                        <div className="text-center text-sm text-gray-500 py-4">
                            ไม่มีไฟล์ให้วิเคราะห์
                        </div>
                      )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">📈 เลือกประเภทกราฟ</label>
                <div className="grid grid-cols-2 gap-3">
                  {chartTypes.map((chart) => (
                    <div key={chart.id} onClick={() => setReportType(chart.id)} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${reportType === chart.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{chart.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-800">{chart.name}</h4>
                          <p className="text-sm text-gray-600">{chart.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Chart & Analysis */}
            <div className="space-y-6 flex flex-col">
              <div className="border border-gray-200 rounded-lg bg-white relative flex-1 min-h-[400px]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">📊 กราฟผลลัพธ์</h3>
                  {generatedChart && (
                    <button onClick={handleDownloadImage} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm">
                      📥 ดาวน์โหลด
                    </button>
                  )}
                </div>
                <div ref={chartContainerRef} className="p-4 h-[calc(100%-65px)]">
                  {isGenerating ? (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg font-medium text-gray-800">🤖 AI กำลังสร้างกราฟ...</p>
                      </div>
                    </div>
                  ) : renderChart()}
                </div>
              </div>

              {analysisResult && !isGenerating && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">📋 สรุปผลการวิเคราะห์</h4>
                    <p className="text-sm text-green-700 whitespace-pre-wrap">{analysisResult.analysis?.summary}</p>
                  </div>
                  {analysisResult.analysis?.insights?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">🔍 ข้อมูลเชิงลึก</h4>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        {analysisResult.analysis.insights.map((insight, index) => <li key={index}>{insight}</li>)}
                      </ul>
                    </div>
                  )}
                  {analysisResult.analysis?.recommendations?.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-2">💡 คำแนะนำ</h4>
                      <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                        {analysisResult.analysis.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex space-x-4">
            <button
              onClick={generateChartWithAI}
              disabled={!reportType || !reportDescription.trim() || isGenerating}
              className="flex-1 py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white hover:opacity-90 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'กำลังสร้าง...' : '🤖 สร้างกราฟด้วย AI'}
            </button>
            <button onClick={onClose} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">ปิด</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;