// src/components/modals/ReportModal.jsx - Pure React Chart (No D3.js)
import React, { useState, useEffect, useRef } from 'react'; // Importa useRef
import html2canvas from 'html2canvas'; // Importa html2canvas

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

  // เพิ่ม ref สำหรับอ้างอิงไปยัง DOM element ของคอนเทนเนอร์กราฟ
  const chartContainerRef = useRef(null);

  // Ollama API Configuration
  const OLLAMA_BASE_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:8080';

  const chartTypes = [
    {
      id: 'pie',
      name: 'Pie Chart',
      description: 'แสดงสัดส่วนประเภทเอกสาร',
      icon: '🥧',
      dataTypes: ['categorical', 'percentage']
    },
    {
      id: 'bar',
      name: 'Bar Chart',
      description: 'เปรียบเทียบจำนวนเอกสารแต่ละประเภท',
      icon: '📊',
      dataTypes: ['categorical', 'numerical']
    },
    {
      id: 'line',
      name: 'Line Chart',
      description: 'แสดงแนวโน้มการอัปโหลดตามเวลา',
      icon: '📈',
      dataTypes: ['temporal', 'trend']
    },
    {
      id: 'donut',
      name: 'Donut Chart',
      description: 'แสดงสัดส่วนแบบโดนัท',
      icon: '🍩',
      dataTypes: ['categorical', 'percentage']
    }
  ];

  // Fetch available models on mount
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
    if (lower.includes('สัดส่วน') || lower.includes('เปอร์เซ็นต์') || lower.includes('ร้อยละ')) return 'pie';
    if (lower.includes('เปรียบเทียบ') || lower.includes('compare') || lower.includes('จำนวน')) return 'bar';
    if (lower.includes('เวลา') || lower.includes('แนวโน้ม') || lower.includes('trend') || lower.includes('timeline')) return 'line';
    return 'bar';
  };

  const recommended = reportDescription ? getRecommendedChart(reportDescription) : null;

  // Analyze files data for AI
  const analyzeFilesData = () => {
    const analysis = {
      totalFiles: files.length,
      fileTypes: {},
      suspiciousFiles: 0,
      ocrFiles: 0,
      owners: new Set()
    };

    files.forEach(file => {
      const type = file.file_type || 'Unknown';
      analysis.fileTypes[type] = (analysis.fileTypes[type] || 0) + 1;
      if (file.is_suspicious || file.similarity_status === 'Yes') analysis.suspiciousFiles++;
      if (file.has_ocr || file.ocr_text) analysis.ocrFiles++;
      if (file.owner) analysis.owners.add(file.owner);
    });

    analysis.owners = Array.from(analysis.owners);
    return analysis;
  };

  // Create fallback chart data when AI fails
  const createFallbackChartData = (dataAnalysis, chartType) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let chartData = [];
    let title = 'กราฟแสดงข้อมูล';

    switch (chartType) {
      case 'pie':
      case 'donut':
        chartData = Object.entries(dataAnalysis.fileTypes).map(([type, count], index) => ({
          label: type,
          value: count,
          color: colors[index % colors.length],
          percentage: dataAnalysis.totalFiles > 0 ? Math.round((count / dataAnalysis.totalFiles) * 100) : 0
        }));
        title = 'สัดส่วนประเภทไฟล์';
        break;

      case 'bar':
        chartData = Object.entries(dataAnalysis.fileTypes).map(([type, count], index) => ({
          label: type,
          value: count,
          color: colors[index % colors.length]
        }));
        title = 'จำนวนไฟล์แต่ละประเภท';
        break;

      default:
        chartData = [
          { label: 'ไฟล์ทั้งหมด', value: dataAnalysis.totalFiles, color: '#3b82f6' },
          { label: 'ไฟล์น่าสงสัย', value: dataAnalysis.suspiciousFiles, color: '#ef4444' },
          { label: 'ไฟล์ OCR', value: dataAnalysis.ocrFiles, color: '#10b981' }
        ];
        title = 'สรุปข้อมูลระบบ';
    }

    return {
      chartData: chartData,
      chartConfig: { title: title, xLabel: 'หมวดหมู่', yLabel: 'จำนวน' },
      analysis: {
        summary: `วิเคราะห์ข้อมูล ${dataAnalysis.totalFiles} ไฟล์ในระบบ`,
        insights: [
          `ประเภทไฟล์ที่พบมากที่สุดคือ ${Object.entries(dataAnalysis.fileTypes).sort(([, a], [, b]) => b - a)[0]?.[0] || 'ไม่ทราบ'}`,
          `มีผู้อัพโหลดทั้งหมด ${dataAnalysis.owners.length} คน`,
          `อัตราไฟล์น่าสงสัย ${dataAnalysis.totalFiles > 0 ? Math.round((dataAnalysis.suspiciousFiles / dataAnalysis.totalFiles) * 100) : 0}%`
        ],
        recommendations: [
          'ควรตรวจสอบไฟล์น่าสงสัยเพิ่มเติม',
          'พิจารณาเพิ่มการป้องกันความปลอดภัย',
          'ควรมีการสำรองข้อมูลเป็นประจำ'
        ]
      }
    };
  };

  // Generate chart with AI
  const generateChartWithAI = async () => {
    if (!selectedModel || !reportDescription.trim()) {
      alert('กรุณาเลือกโมเดล AI และใส่คำอธิบาย');
      return;
    }

    setIsGenerating(true);
    setAiStatus('thinking');

    try {
      const dataAnalysis = analyzeFilesData();
      const fallbackResult = createFallbackChartData(dataAnalysis, reportType);

      try {
        const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูล\n\nข้อมูลไฟล์: ${dataAnalysis.totalFiles} ไฟล์, ประเภท: ${JSON.stringify(dataAnalysis.fileTypes)}\nคำขอ: "${reportDescription}"\n\nตอบเป็น JSON:\n{\n  "chartData": [{"label": "PDF", "value": 25, "color": "#3b82f6"}],\n  "chartConfig": {"title": "กราฟ", "xLabel": "ประเภท", "yLabel": "จำนวน"},\n  "analysis": {\n    "summary": "สรุป",\n    "insights": ["ข้อมูลเชิงลึก"],\n    "recommendations": ["คำแนะนำ"]\n  }\n}`;
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
            try {
              const cleanResponse = data.response.trim().match(/\{[\s\S]*\}/)?.[0];
              if (cleanResponse) {
                const aiResult = JSON.parse(cleanResponse);
                if (aiResult.chartData && Array.isArray(aiResult.chartData)) {
                  setAnalysisResult(aiResult);
                  setGeneratedChart(true);
                  setAiStatus('ready');
                  return;
                }
              }
            } catch (parseError) {
              console.warn('AI parse failed, using fallback');
            }
          }
        }
      } catch (aiError) {
        console.warn('AI failed, using fallback:', aiError);
      }

      setAnalysisResult(fallbackResult);
      setGeneratedChart(true);
      setAiStatus('ready');

    } catch (error) {
      console.error('Chart generation error:', error);
      setAiStatus('error');
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // *** ฟังก์ชันสำหรับดาวน์โหลดรูปภาพของกราฟ ***
  const handleDownloadImage = () => {
    if (chartContainerRef.current) {
      html2canvas(chartContainerRef.current, {
        useCORS: true, // จำเป็นถ้ามีรูปภาพจาก origin อื่น
        backgroundColor: '#ffffff', // ตั้งค่าพื้นหลังเป็นสีขาวเพื่อหลีกเลี่ยงความโปร่งใส
        onclone: (document) => {
          // ซ่อน element ที่ไม่ต้องการให้ปรากฏในภาพ screenshot
          const spinner = document.querySelector('.absolute.inset-0.bg-white');
          if (spinner) spinner.style.visibility = 'hidden';
        }
      }).then(canvas => {
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `chart-${reportType}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch(err => {
        console.error("Oops, something went wrong!", err);
        alert('เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ');
      });
    }
  };


  // Pure React Chart Components
  const ReactBarChart = ({ data, config }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    return (
      <div className="w-full h-80 p-4 bg-white">
        <h3 className="text-lg font-bold text-center mb-4">{config?.title}</h3>
        <div className="flex items-end justify-center space-x-2 h-64">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                style={{
                  height: `${maxValue > 0 ? (item.value / maxValue) * 200 : 0}px`,
                  width: '40px',
                  backgroundColor: item.color
                }}
                title={`${item.label}: ${item.value}`}
              ></div>
              <div className="text-xs mt-2 text-center font-medium">{item.value}</div>
              <div className="text-xs text-gray-600 text-center max-w-16 truncate">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReactPieChart = ({ data, config, isDonut = false }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;
    return (
      <div className="w-full h-80 p-4 bg-white">
        <h3 className="text-lg font-bold text-center mb-4">{config?.title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
              {data.map((item, index) => {
                if (item.value <= 0) return null;
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = -cumulativePercentage;
                cumulativePercentage += percentage;
                return (
                  <circle
                    key={index}
                    cx="100"
                    cy="100"
                    r={isDonut ? "80" : "50"}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isDonut ? "40" : "100"}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              })}
            </svg>
            {isDonut && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="text-sm text-gray-600">ไฟล์</div>
                </div>
              </div>
            )}
          </div>
          <div className="ml-8">
            {data.map((item, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm">{item.label}: {item.value}</span>
                {item.percentage !== undefined && (
                  <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ReactLineChart = ({ data, config }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 300;
      const y = 200 - (maxValue > 0 ? (item.value / maxValue) * 150 : 0);
      return `${x},${y}`;
    }).join(' ');
    return (
      <div className="w-full h-80 p-4 bg-white">
        <h3 className="text-lg font-bold text-center mb-4">{config?.title}</h3>
        <div className="flex justify-center">
          <svg width="350" height="250" className="border border-gray-200">
            {data.length > 1 && <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />}
            {data.map((item, index) => {
              const x = data.length > 1 ? (index / (data.length - 1)) * 300 : 150;
              const y = 200 - (maxValue > 0 ? (item.value / maxValue) * 150 : 0);
              return (
                <g key={index}>
                  <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                  <text x={x} y="230" textAnchor="middle" className="text-xs fill-gray-600">{item.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };


  const renderChart = () => {
    if (!generatedChart || !analysisResult?.chartData) {
      return (
        <div className="w-full h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">พร้อมสร้างกราฟ</p>
            <p className="text-sm">เลือกประเภทกราฟและคลิก "สร้างกราฟด้วย AI"</p>
          </div>
        </div>
      );
    }

    const { chartData, chartConfig } = analysisResult;

    switch (reportType) {
      case 'pie': return <ReactPieChart data={chartData} config={chartConfig} />;
      case 'donut': return <ReactPieChart data={chartData} config={chartConfig} isDonut={true} />;
      case 'line': return <ReactLineChart data={chartData} config={chartConfig} />;
      case 'bar': default: return <ReactBarChart data={chartData} config={chartConfig} />;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl flex flex-col"
        style={{ maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              🤖 AI Chart Generator
            </h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${aiStatus === 'ready' ? 'bg-green-100 text-green-800' : aiStatus === 'thinking' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              <div className={`w-2 h-2 rounded-full ${aiStatus === 'ready' ? 'bg-green-500' : aiStatus === 'thinking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span>{aiStatus === 'ready' ? 'พร้อมใช้งาน' : aiStatus === 'thinking' ? 'กำลังสร้างกราฟ...' : 'เกิดข้อผิดพลาด'}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-xl text-gray-500">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🤖 เลือกโมเดล AI</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">เลือกโมเดล...</option>
                  {availableModels.map(model => (<option key={model.name} value={model.name}>{model.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 อธิบายสิ่งที่ต้องการวิเคราะห์</label>
                <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none" rows="4" placeholder="เช่น แสดงสัดส่วนประเภทเอกสาร, เปรียบเทียบจำนวนไฟล์..." />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📊 ข้อมูลในระบบ:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>📁 ไฟล์ทั้งหมด: {files.length}</div>
                  <div>⚠️ ไฟล์น่าสงสัย: {files.filter(f => f.is_suspicious).length}</div>
                  <div>📄 PDF: {files.filter(f => f.file_type === 'PDF').length}</div>
                  <div>🖼️ รูปภาพ: {files.filter(f => ['JPG', 'JPEG', 'PNG'].includes(f.file_type)).length}</div>
                  <div>👁️ มี OCR: {files.filter(f => f.has_ocr).length}</div>
                  <div>👥 ผู้อัพโหลด: {new Set(files.map(f => f.owner)).size}</div>
                </div>
              </div>
              {recommended && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">💡 AI แนะนำกราฟ:</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{chartTypes.find(c => c.id === recommended)?.icon}</span>
                    <div>
                      <p className="font-medium text-purple-700">{chartTypes.find(c => c.id === recommended)?.name}</p>
                      <p className="text-sm text-purple-600">{chartTypes.find(c => c.id === recommended)?.description}</p>
                    </div>
                  </div>
                  <button onClick={() => setReportType(recommended)} className="mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm">ใช้กราฟนี้</button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">📈 เลือกประเภทกราฟ</label>
                <div className="grid grid-cols-1 gap-3">
                  {chartTypes.map((chart) => (
                    <div key={chart.id} onClick={() => setReportType(chart.id)} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${reportType === chart.id ? 'border-green-500 bg-green-50' : recommended === chart.id ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{chart.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-800">{chart.name}</h4>
                          <p className="text-sm text-gray-600">{chart.description}</p>
                          {recommended === chart.id && (<span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full mt-1 inline-block">AI แนะนำ</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Chart */}
            <div className="space-y-6">
              {/* *** เพิ่ม ref ที่นี่ *** */}
              <div ref={chartContainerRef} className="border border-gray-200 rounded-lg bg-white min-h-96 relative">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">📊 กราฟผลลัพธ์</h3>
                  {generatedChart && (
                    // *** เพิ่ม onClick event ที่นี่ ***
                    <button
                      onClick={handleDownloadImage}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      📥 ดาวน์โหลด
                    </button>
                  )}
                </div>

                {renderChart()}

                {isGenerating && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium text-gray-800 mb-2">🤖 AI กำลังสร้างกราฟ...</p>
                      <p className="text-sm text-gray-600">การวิเคราะห์ข้อมูลและสร้างภาพ</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">📋 สรุปผลการวิเคราะห์</h4>
                    <p className="text-sm text-green-700">{analysisResult.analysis?.summary}</p>
                  </div>
                  {analysisResult.analysis?.insights && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">🔍 ข้อมูลเชิงลึก</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {analysisResult.analysis.insights.map((insight, index) => (
                          <li key={index} className="flex items-start space-x-2"><span className="text-blue-500 mt-0.5">•</span><span>{insight}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.analysis?.recommendations && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-2">💡 คำแนะนำ</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        {analysisResult.analysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2"><span className="text-purple-500 mt-0.5">•</span><span>{rec}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-4">
            <button
              onClick={generateChartWithAI}
              disabled={!reportType || !reportDescription.trim() || isGenerating}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${!reportType || !reportDescription.trim() || isGenerating ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white transform hover:scale-105'}`}
            >
              {isGenerating ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>กำลังสร้าง...</span></>
              ) : (
                <><span>🤖</span><span>สร้างกราฟด้วย AI</span></>
              )}
            </button>
            {generatedChart && (
              <button
                onClick={() => {
                  const reportData = { description: reportDescription, chartType: reportType, analysis: analysisResult, timestamp: new Date().toISOString(), fileCount: files.length };
                  const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const jsonUrl = URL.createObjectURL(jsonBlob);
                  const downloadLink = document.createElement('a');
                  downloadLink.href = jsonUrl;
                  downloadLink.download = `report-${Date.now()}.json`;
                  downloadLink.click();
                  URL.revokeObjectURL(jsonUrl);
                }}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>💾</span><span>บันทึกรายงาน</span>
              </button>
            )}
            <button onClick={onClose} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              ปิด
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>📊 กราฟ: {reportType || 'ยังไม่เลือก'}</span>
              <span>🤖 โมเดล: {selectedModel || 'ยังไม่เลือก'}</span>
              <span>📁 ไฟล์: {files.length} รายการ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${selectedModel && reportType && reportDescription.trim() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>{selectedModel && reportType && reportDescription.trim() ? 'พร้อมสร้างกราฟ' : 'กรุณากรอกข้อมูลให้ครบ'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;