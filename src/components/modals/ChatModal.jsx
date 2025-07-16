// src/components/modals/ChatModal.jsx - Fixed Version with Ollama Integration
import React, { useState, useEffect, useRef } from 'react';
import DocumentTypeChart from '../charts/DocumentTypeChart';
import ApiService from '../../services/ApiService';

// ✅ Add Custom CSS for Webkit scrollbars
const customStyles = `
  .chat-scroll::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-scroll::-webkit-scrollbar-track {
    background: #f7fafc;
  }
  
  .chat-scroll::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 3px;
  }
  
  .chat-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #a0aec0;
  }
`;

const ChatModal = ({
    onClose,
    messages = [],
    inputMessage = '',
    setInputMessage,
    onSendMessage,
    files = []
}) => {
    const [chatMessages, setChatMessages] = useState(messages);
    const [currentInput, setCurrentInput] = useState(inputMessage);
    const [isTyping, setIsTyping] = useState(false);
    const [aiStatus, setAiStatus] = useState('ready'); // 'ready', 'thinking', 'error', 'loading'
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [chatMode, setChatMode] = useState('general'); // 'general', 'analysis', 'suspicious'
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFiles, setFilteredFiles] = useState(files);
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // ✅ Ollama API Configuration
    const OLLAMA_BASE_URL = import.meta.env.VITE_LOCAL_AI_URL || 'http://localhost:11434';

    // ✅ Apply custom styles on mount
    useEffect(() => {
        console.log('🎨 ChatModal: Applying custom styles...');
        const styleElement = document.createElement('style');
        styleElement.textContent = customStyles;
        document.head.appendChild(styleElement);

        return () => {
            if (document.head.contains(styleElement)) {
                document.head.removeChild(styleElement);
            }
        };
    }, []);

    // ✅ Fetch available models from Ollama on component mount
    useEffect(() => {
        console.log('🤖 ChatModal: Fetching Ollama models...');
        fetchOllamaModels();
    }, []);

    useEffect(() => {
        console.log('💬 ChatModal: Messages updated, count:', chatMessages.length);
        scrollToBottom();
    }, [chatMessages]);

    useEffect(() => {
        console.log('🔍 ChatModal: Focusing input...');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // ✅ File Search Filter
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredFiles(files);
        } else {
            const filtered = files.filter(file => {
                const fileName = (file.original_name || file.filename || '').toLowerCase();
                const fileType = (file.file_type || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                
                return fileName.includes(query) || fileType.includes(query);
            });
            setFilteredFiles(filtered);
        }
    }, [searchQuery, files]);

    // ✅ Clear search when files change
    useEffect(() => {
        setSearchQuery('');
    }, [files]);

    // ✅ Fetch available models from Ollama
    const fetchOllamaModels = async () => {
        try {
            console.log('🔄 Starting Ollama models fetch...');
            setLoadingModels(true);
            setAiStatus('loading');
            
            console.log('🔍 Fetching models from Ollama:', OLLAMA_BASE_URL);
            
            const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('📡 Ollama response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Ollama models response:', data);

            if (data && data.models && Array.isArray(data.models)) {
                const models = data.models.map(model => ({
                    id: model.name,
                    name: model.name,
                    displayName: model.name.split(':')[0], // Remove tag if present
                    size: model.size ? formatBytes(model.size) : 'Unknown',
                    description: getModelDescription(model.name),
                    icon: getModelIcon(model.name),
                    capabilities: getModelCapabilities(model.name),
                    details: model.details || {},
                    modified_at: model.modified_at,
                    digest: model.digest
                }));

                console.log('✅ Processed models:', models);
                setAvailableModels(models);
                
                // Set default model (first available model)
                if (models.length > 0 && !selectedModel) {
                    console.log('🎯 Setting default model:', models[0].id);
                    setSelectedModel(models[0].id);
                }

                console.log('✅ Models loaded:', models.length);
                setAiStatus('ready');
            } else {
                throw new Error('Invalid response format from Ollama');
            }
        } catch (error) {
            console.error('❌ Failed to fetch Ollama models:', error);
            
            // Set fallback models or empty array
            setAvailableModels([]);
            setAiStatus('error');
            
            // Add error message to chat
            const errorMessage = {
                id: Date.now(),
                type: 'system',
                text: `⚠️ ไม่สามารถเชื่อมต่อกับ Ollama ได้\n\nข้อผิดพลาด: ${error.message}\n\n💡 กรุณาตรวจสอบ:\n• Ollama ทำงานอยู่ที่ ${OLLAMA_BASE_URL}\n• เครือข่ายการเชื่อมต่อ\n• การตั้งค่า CORS`,
                timestamp: new Date(),
                error: true
            };
            console.log('📝 Adding error message to chat:', errorMessage);
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            console.log('🏁 Ollama models fetch completed');
            setLoadingModels(false);
        }
    };

    // ✅ Helper function to format bytes
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // ✅ Get model description based on name
    const getModelDescription = (modelName) => {
        const name = modelName.toLowerCase();
        if (name.includes('llama')) return 'โมเดลภาษาขนาดใหญ่ เหมาะสำหรับงานทั่วไป';
        if (name.includes('mistral')) return 'โมเดลประสิทธิภาพสูง เหมาะสำหรับการวิเคราะห์';
        if (name.includes('codellama')) return 'โมเดลเฉพาะสำหรับการเขียนโค้ด';
        if (name.includes('thai')) return 'โมเดลเฉพาะภาษาไทย';
        if (name.includes('gemma')) return 'โมเดลขนาดเล็ก รวดเร็ว';
        if (name.includes('qwen')) return 'โมเดลอเนกประสงค์ ประสิทธิภาพดี';
        return 'โมเดล AI สำหรับงานทั่วไป';
    };

    // ✅ Get model icon based on name
    const getModelIcon = (modelName) => {
        const name = modelName.toLowerCase();
        if (name.includes('llama')) return '🦙';
        if (name.includes('mistral')) return '💨';
        if (name.includes('codellama')) return '💻';
        if (name.includes('thai')) return '🇹🇭';
        if (name.includes('gemma')) return '💎';
        if (name.includes('qwen')) return '🧠';
        return '🤖';
    };

    // ✅ Get model capabilities based on name
    const getModelCapabilities = (modelName) => {
        const name = modelName.toLowerCase();
        const capabilities = [];
        
        if (name.includes('thai')) capabilities.push('ภาษาไทย');
        if (name.includes('code')) capabilities.push('การเขียนโค้ด');
        if (name.includes('llama')) capabilities.push('การสนทนา', 'การวิเคราะห์');
        if (name.includes('mistral')) capabilities.push('ประสิทธิภาพสูง', 'การใช้เหตุผล');
        if (name.includes('gemma')) capabilities.push('รวดเร็ว', 'ประหยัด');
        if (name.includes('qwen')) capabilities.push('อเนกประสงค์', 'ความแม่นยำ');
        
        if (capabilities.length === 0) {
            capabilities.push('งานทั่วไป', 'การสนทนา');
        }
        
        return capabilities;
    };

    // ✅ Get current model info
    const getCurrentModel = () => {
        return availableModels.find(model => model.id === selectedModel) || availableModels[0] || null;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ✅ Enhanced AI Response Handler with Ollama Integration
    const handleSendMessage = async () => {
        if (!currentInput.trim() || !selectedModel) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: currentInput.trim(),
            timestamp: new Date(),
            files: selectedFiles.length > 0 ? selectedFiles : null
        };

        // Add user message
        setChatMessages(prev => [...prev, userMessage]);

        // Clear input and show typing
        const messageText = currentInput.trim();
        setCurrentInput('');
        setIsTyping(true);
        setAiStatus('thinking');

        try {
            // Call Ollama AI service
            const aiResponse = await getOllamaResponse(messageText, selectedFiles, chatMode);

            // Add AI response
            setChatMessages(prev => [...prev, aiResponse]);
            setAiStatus('ready');

        } catch (error) {
            console.error('❌ AI Response Error:', error);

            // Add error message
            const errorResponse = {
                id: Date.now() + 1,
                type: 'ai',
                text: `ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล\n\nข้อผิดพลาด: ${error.message}\n\n💡 เคล็ดลับ:\n• ตรวจสอบการเชื่อมต่อ Ollama\n• ลองใช้โมเดลอื่น\n• ตรวจสอบ ${OLLAMA_BASE_URL}`,
                timestamp: new Date(),
                error: true
            };

            setChatMessages(prev => [...prev, errorResponse]);
            setAiStatus('error');

            // Reset to ready after 3 seconds
            setTimeout(() => setAiStatus('ready'), 3000);
        } finally {
            setIsTyping(false);
            setSelectedFiles([]);
        }

        // Update parent component if needed
        if (onSendMessage) {
            onSendMessage();
        }
    };

    // ✅ Ollama AI Response Service
    const getOllamaResponse = async (message, attachedFiles = [], mode = 'general') => {
        const response = {
            id: Date.now() + 1,
            type: 'ai',
            timestamp: new Date(),
            mode: mode,
            model: getCurrentModel()?.displayName
        };

        try {
            // Build context for the AI based on files and mode
            const context = buildAIContext(message, attachedFiles, files, mode);
            
            // Make request to Ollama
            const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    prompt: context,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        top_k: 40,
                        repeat_penalty: 1.1
                    }
                })
            });

            if (!ollamaResponse.ok) {
                throw new Error(`Ollama API error: ${ollamaResponse.status}`);
            }

            const data = await ollamaResponse.json();
            
            if (data && data.response) {
                response.text = data.response;
                
                // Add chart if response mentions statistics or analysis
                if (data.response.includes('สถิติ') || data.response.includes('กราฟ') || data.response.includes('วิเคราะห์')) {
                    response.chart = 'document_types';
                }
            } else {
                throw new Error('Invalid response from Ollama');
            }

        } catch (error) {
            console.error('❌ Ollama API Error:', error);
            throw error;
        }

        return response;
    };

    // ✅ Build AI Context based on message and files
    const buildAIContext = (message, attachedFiles, allFiles, mode) => {
        const messageText = message.toLowerCase();
        
        // Base system prompt
        let context = `คุณเป็นผู้ช่วย AI สำหรับระบบตรวจสอบและวิเคราะห์เอกสาร โปรดตอบเป็นภาษาไทยและใช้อีโมจิให้เหมาะสม\n\n`;
        
        // Add files context
        context += `ข้อมูลไฟล์ในระบบ:\n`;
        context += `- จำนวนไฟล์ทั้งหมด: ${allFiles.length} ไฟล์\n`;
        
        if (allFiles.length > 0) {
            const pdfCount = allFiles.filter(f => f.file_type === 'PDF').length;
            const imageCount = allFiles.filter(f => ['JPG', 'JPEG', 'PNG'].includes(f.file_type)).length;
            const suspiciousCount = allFiles.filter(f => f.similarity_status === 'Yes' || f.is_suspicious).length;
            const ocrCount = allFiles.filter(f => f.ocr_text || f.has_ocr).length;
            
            context += `- ไฟล์ PDF: ${pdfCount} ไฟล์\n`;
            context += `- ไฟล์รูปภาพ: ${imageCount} ไฟล์\n`;
            context += `- ไฟล์น่าสงสัย: ${suspiciousCount} ไฟล์\n`;
            context += `- ไฟล์ที่มี OCR: ${ocrCount} ไฟล์\n`;
        }
        
        // Add attached files context
        if (attachedFiles.length > 0) {
            context += `\nไฟล์ที่ผู้ใช้เลือกสำหรับวิเคราะห์:\n`;
            attachedFiles.forEach((file, index) => {
                context += `${index + 1}. ${file.original_name || file.filename} (${file.file_type}, ${ApiService.formatFileSize(file.file_size || 0)})\n`;
            });
        }
        
        // Add specific instructions based on message content
        if (messageText.includes('วิเคราะห์') || messageText.includes('ตรวจสอบ')) {
            context += `\nผู้ใช้ต้องการการวิเคราะห์ไฟล์ โปรดให้รายละเอียดการวิเคราะห์และคำแนะนำ\n`;
        } else if (messageText.includes('สถิติ') || messageText.includes('รายงาน')) {
            context += `\nผู้ใช้ต้องการสถิติและรายงาน โปรดแสดงข้อมูลเชิงตัวเลขและสรุป\n`;
        } else if (messageText.includes('น่าสงสัย') || messageText.includes('อันตราย')) {
            context += `\nผู้ใช้สนใจเรื่องความปลอดภัยและไฟล์น่าสงสัย โปรดให้คำแนะนำด้านความปลอดภัย\n`;
        } else if (messageText.includes('ocr') || messageText.includes('ข้อความ')) {
            context += `\nผู้ใช้สนใจเรื่องการอ่านข้อความ OCR โปรดให้ข้อมูลเกี่ยวกับ OCR\n`;
        }
        
        context += `\nคำถามของผู้ใช้: ${message}\n\nโปรดตอบอย่างเป็นประโยชน์และชัดเจน:`;
        
        return context;
    };

    // ✅ Clear Search Function
    const clearSearch = () => {
        setSearchQuery('');
    };

    // ✅ Model Selection Functions
    const selectModel = (modelId) => {
        setSelectedModel(modelId);
        setShowModelSelector(false);
        
        // Add system message about model change
        const currentModel = availableModels.find(m => m.id === modelId);
        if (currentModel) {
            const modelChangeMessage = {
                id: Date.now(),
                type: 'system',
                text: `🔄 เปลี่ยนโมเดล AI เป็น ${currentModel.displayName}\n\n${currentModel.description}\n\n💡 ความสามารถ: ${currentModel.capabilities.join(', ')}\n📏 ขนาด: ${currentModel.size}`,
                timestamp: new Date(),
                model: currentModel
            };
            setChatMessages(prev => [...prev, modelChangeMessage]);
        }
    };

    // ✅ Refresh models function
    const refreshModels = () => {
        fetchOllamaModels();
    };

    // ✅ File Selection for Analysis
    const toggleFileSelection = (file) => {
        setSelectedFiles(prev => {
            const isSelected = prev.find(f => f.id === file.id);
            if (isSelected) {
                return prev.filter(f => f.id !== file.id);
            } else {
                return [...prev, file];
            }
        });
    };

    // ✅ Quick Action Buttons
    const quickActions = [
        {
            text: 'แสดงสถิติไฟล์',
            icon: '📊',
            action: () => setCurrentInput('แสดงสถิติไฟล์ทั้งหมดในระบบ')
        },
        {
            text: 'ตรวจสอบไฟล์น่าสงสัย',
            icon: '🚨',
            action: () => setCurrentInput('ตรวจสอบไฟล์ที่น่าสงสัยในระบบ')
        },
        {
            text: 'วิเคราะห์ไฟล์ที่เลือก',
            icon: '🔍',
            action: () => setCurrentInput('วิเคราะห์ไฟล์ที่ฉันเลือก'),
            disabled: selectedFiles.length === 0
        },
        {
            text: 'ผลการ OCR',
            icon: '👁️',
            action: () => setCurrentInput('แสดงผลการอ่านข้อความ OCR')
        },
        {
            text: 'ค้นหาไฟล์',
            icon: '🔍',
            action: () => {
                // Focus on search input in sidebar
                const searchInput = document.querySelector('input[placeholder="ค้นหาชื่อไฟล์..."]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        },
        {
            text: 'เปลี่ยนโมเดล',
            icon: '🔄',
            action: () => setShowModelSelector(!showModelSelector)
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-7xl h-[95vh] shadow-2xl flex overflow-hidden"
                 style={{ 
                    minWidth: '1200px',
                    maxHeight: '95vh'
                 }}
            >
                {/* DEBUG: Show component is mounted */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-10">
                        ChatModal Active
                    </div>
                )}

                {/* ✅ Sidebar - File Selection */}
                <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white"
                     style={{ minWidth: '320px', maxWidth: '320px' }}
                >
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 mb-2">📁 เลือกไฟล์สำหรับวิเคราะห์</h3>
                        <p className="text-xs text-gray-600 mb-3">เลือกไฟล์ที่ต้องการให้ AI วิเคราะห์</p>
                        
                        {/* Search Box */}
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อไฟล์..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 pl-9 pr-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                🔍
                            </div>
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* File Count Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                {searchQuery ? `พบ ${filteredFiles.length} จาก ${files.length} ไฟล์` : `ทั้งหมด ${files.length} ไฟล์`}
                            </span>
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    ล้างการค้นหา
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Scrollable File List */}
                    <div className="flex-1 overflow-y-auto chat-scroll">
                        {files.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center text-gray-500 p-8">
                                <div>
                                    <div className="text-4xl mb-2">📂</div>
                                    <p className="text-sm">ไม่มีไฟล์ในระบบ</p>
                                    <p className="text-xs mt-1">อัพโหลดไฟล์เพื่อเริ่มวิเคราะห์</p>
                                </div>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center text-gray-500 p-8">
                                <div>
                                    <div className="text-4xl mb-2">🔍</div>
                                    <p className="text-sm">ไม่พบไฟล์ที่ตรงกับการค้นหา</p>
                                    <p className="text-xs mt-1">"{searchQuery}"</p>
                                    <button
                                        onClick={clearSearch}
                                        className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                        ล้างการค้นหา
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3">
                                {/* Search Results Header */}
                                {searchQuery && (
                                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs text-blue-800 font-medium">
                                            🔍 ผลการค้นหา "{searchQuery}"
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            พบ {filteredFiles.length} ไฟล์ที่ตรงกับการค้นหา
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {filteredFiles.map(file => (
                                        <div
                                            key={file.id}
                                            onClick={() => toggleFileSelection(file)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${selectedFiles.find(f => f.id === file.id)
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                {/* File Icon */}
                                                <div className="flex-shrink-0 text-xl">
                                                    {ApiService.getFileIcon(file.file_type, file.mime_type)}
                                                </div>

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="text-sm font-medium text-gray-800 leading-tight mb-1"
                                                        style={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            wordBreak: 'break-word'
                                                        }}
                                                        title={file.original_name || file.filename}
                                                        dangerouslySetInnerHTML={{
                                                            __html: searchQuery ? 
                                                                (file.original_name || file.filename).replace(
                                                                    new RegExp(`(${searchQuery})`, 'gi'),
                                                                    '<mark style="background-color: #fef08a; padding: 1px 2px; border-radius: 2px;">$1</mark>'
                                                                ) : 
                                                                (file.original_name || file.filename)
                                                        }}
                                                    >
                                                    </p>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded">{file.file_type}</span>
                                                        <span>{ApiService.formatFileSize(file.file_size || 0)}</span>
                                                    </div>

                                                    {/* Status Badges */}
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {file.is_suspicious && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                                                ⚠️ น่าสงสัย
                                                            </span>
                                                        )}
                                                        {file.has_ocr && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                                                👁️ OCR
                                                            </span>
                                                        )}
                                                        {file.similarity_status === 'Yes' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                                                                🔍 คล้ายกัน
                                                            </span>
                                                        )}
                                                        {file.ocr_text && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                                                📝 มีข้อความ
                                                            </span>
                                                        )}
                                                        {file.file_size && file.file_size > 10485760 && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                                                                📦 ไฟล์ใหญ่
                                                            </span>
                                                        )}
                                                        {new Date(file.uploaded_at).toDateString() === new Date().toDateString() && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-cyan-100 text-cyan-800">
                                                                🆕 วันนี้
                                                            </span>
                                                        )}
                                                        {selectedFiles.find(f => f.id === file.id) && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                                                ✓ เลือกแล้ว
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed Footer - Selected Files Summary */}
                    {selectedFiles.length > 0 && (
                        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-blue-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-800">
                                    📎 เลือกแล้ว {selectedFiles.length} ไฟล์
                                </span>
                                <button
                                    onClick={() => setSelectedFiles([])}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    ล้างทั้งหมด
                                </button>
                            </div>

                            {/* Preview selected files */}
                            <div className="space-y-1 max-h-20 overflow-y-auto chat-scroll">
                                {selectedFiles.slice(0, 3).map(file => (
                                    <div key={file.id} className="text-xs text-blue-700 truncate">
                                        • {file.original_name || file.filename}
                                    </div>
                                ))}
                                {selectedFiles.length > 3 && (
                                    <div className="text-xs text-blue-600">
                                        และอีก {selectedFiles.length - 3} ไฟล์...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ Main Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50" style={{ minWidth: '600px' }}>
                    {/* DEBUG: Show main area is rendering */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-yellow-200 p-2 border-b border-yellow-300">
                            <span className="text-sm font-bold">DEBUG: Main Chat Area</span>
                            <div className="text-xs">
                                Models: {availableModels.length} | Selected: {selectedModel || 'None'} | Status: {aiStatus}
                            </div>
                        </div>
                    )}
                    
                    {/* Header */}
                    <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        🤖 AI Assistant
                                    </h2>
                                    
                                    {/* Model Selector Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowModelSelector(!showModelSelector)}
                                            disabled={loadingModels}
                                            className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-70 hover:bg-opacity-90 rounded-lg border border-purple-200 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loadingModels ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-purple-700">
                                                            กำลังโหลด...
                                                        </div>
                                                        <div className="text-xs text-purple-500">
                                                            เชื่อมต่อ Ollama
                                                        </div>
                                                    </div>
                                                </>
                                            ) : getCurrentModel() ? (
                                                <>
                                                    <span className="text-lg">{getCurrentModel().icon}</span>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-purple-700">
                                                            {getCurrentModel().displayName}
                                                        </div>
                                                        <div className="text-xs text-purple-500">
                                                            {getCurrentModel().size}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-lg">❌</span>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-red-700">
                                                            ไม่พบโมเดล
                                                        </div>
                                                        <div className="text-xs text-red-500">
                                                            ตรวจสอบ Ollama
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            <span className={`text-purple-500 transition-transform duration-200 ${showModelSelector ? 'rotate-180' : ''}`}>
                                                ▼
                                            </span>
                                        </button>

                                        {/* Model Selector Dropdown */}
                                        {showModelSelector && (
                                            <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                                                <div className="p-3 border-b border-gray-100 bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800 text-sm">🤖 โมเดล Ollama</h3>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                เชื่อมต่อกับ {OLLAMA_BASE_URL}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={refreshModels}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
                                                            title="รีเฟรชรายการโมเดล"
                                                        >
                                                            🔄
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="max-h-64 overflow-y-auto">
                                                    {loadingModels ? (
                                                        <div className="p-8 text-center">
                                                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                            <p className="text-sm text-gray-600">กำลังโหลดโมเดล...</p>
                                                        </div>
                                                    ) : availableModels.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <div className="text-4xl mb-2">❌</div>
                                                            <p className="text-sm text-gray-600 mb-2">ไม่พบโมเดลใน Ollama</p>
                                                            <p className="text-xs text-gray-500 mb-3">
                                                                ตรวจสอบ {OLLAMA_BASE_URL}
                                                            </p>
                                                            <button
                                                                onClick={refreshModels}
                                                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                                                            >
                                                                ลองอีกครั้ง
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        availableModels.map((model) => (
                                                            <button
                                                                key={model.id}
                                                                onClick={() => selectModel(model.id)}
                                                                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                                                    selectedModel === model.id ? 'bg-purple-50 border-purple-200' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <span className="text-xl mt-0.5">{model.icon}</span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <h4 className="font-medium text-gray-800 text-sm truncate">
                                                                                {model.displayName}
                                                                            </h4>
                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                                {model.size}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                                            {model.description}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                                            {model.capabilities.slice(0, 3).map((capability, idx) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full"
                                                                                >
                                                                                    {capability}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        {model.modified_at && (
                                                                            <p className="text-xs text-gray-400">
                                                                                อัพเดต: {new Date(model.modified_at).toLocaleDateString('th-TH')}
                                                                            </p>
                                                                        )}
                                                                        {selectedModel === model.id && (
                                                                            <div className="mt-2 flex items-center text-xs text-purple-600">
                                                                                <span className="mr-1">✓</span>
                                                                                กำลังใช้งาน
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                                
                                                <div className="p-3 bg-gray-50 border-t border-gray-100">
                                                    <p className="text-xs text-gray-600 text-center">
                                                        💡 โมเดลมาจาก Ollama ที่ {OLLAMA_BASE_URL}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                    ผู้ช่วยตรวจสอบและวิเคราะห์เอกสาร โดย Ollama
                                </p>

                                {/* AI Status */}
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            aiStatus === 'ready' ? 'bg-green-500' :
                                            aiStatus === 'thinking' ? 'bg-yellow-500 animate-pulse' :
                                            aiStatus === 'loading' ? 'bg-blue-500 animate-pulse' :
                                            'bg-red-500'
                                        }`}></div>
                                        <span className="text-xs text-gray-500">
                                            {aiStatus === 'ready' ? 'พร้อมใช้งาน' :
                                                aiStatus === 'thinking' ? 'กำลังคิด...' :
                                                aiStatus === 'loading' ? 'กำลังโหลด...' :
                                                'เกิดข้อผิดพลาด'}
                                        </span>
                                    </div>
                                    
                                    {/* Current Model Info */}
                                    {getCurrentModel() && (
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <span>โมเดล:</span>
                                            <span className="font-medium text-purple-600">
                                                {getCurrentModel().displayName}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Ollama Connection Status */}
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <span>Ollama:</span>
                                        <span className={`font-medium ${
                                            availableModels.length > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {availableModels.length > 0 ? 'เชื่อมต่อแล้ว' : 'ไม่เชื่อมต่อ'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors duration-200"
                            >
                                <span className="text-xl text-gray-500">✕</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    disabled={action.disabled || !selectedModel}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        action.disabled || !selectedModel
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200'
                                    }`}
                                >
                                    <span>{action.icon}</span>
                                    <span>{action.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 bg-gray-50 overflow-y-auto chat-scroll" style={{ minHeight: '400px' }}>
                        <div className="p-6">
                            {chatMessages.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🤖</div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">สวัสดีครับ!</h3>
                                    <p className="text-gray-600 mb-2">ผมคือผู้ช่วย AI สำหรับตรวจสอบและวิเคราะห์เอกสาร</p>
                                    <p className="text-sm text-gray-500 mb-6">
                                        ขับเคลื่อนโดย Ollama - {availableModels.length} โมเดลพร้อมใช้งาน
                                    </p>
                                    
                                    {!selectedModel && availableModels.length > 0 && (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                                            <p className="text-sm text-yellow-800 mb-2">⚠️ กรุณาเลือกโมเดล AI ก่อนเริ่มสนทนา</p>
                                            <button
                                                onClick={() => setShowModelSelector(true)}
                                                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                                            >
                                                เลือกโมเดล
                                            </button>
                                        </div>
                                    )}
                                    
                                    {availableModels.length === 0 && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                                            <p className="text-sm text-red-800 mb-2">❌ ไม่พบโมเดลใน Ollama</p>
                                            <p className="text-xs text-red-600 mb-3">
                                                ตรวจสอบ {OLLAMA_BASE_URL}
                                            </p>
                                            <button
                                                onClick={refreshModels}
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm"
                                            >
                                                ลองเชื่อมต่อใหม่
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="bg-white rounded-lg p-4 max-w-md mx-auto text-left shadow-sm">
                                        <p className="text-sm text-gray-700 mb-3 font-medium">💡 ตัวอย่างคำถาม:</p>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            <li>• "แสดงสถิติไฟล์ในระบบ"</li>
                                            <li>• "ตรวจสอบไฟล์ที่น่าสงสัย"</li>
                                            <li>• "วิเคราะห์ไฟล์ที่ฉันเลือก"</li>
                                            <li>• "แสดงผลการ OCR"</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chatMessages.map((message) => (
                                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-2xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                                                <div className={`px-4 py-3 rounded-2xl ${
                                                    message.type === 'user'
                                                        ? 'bg-purple-500 text-white'
                                                        : message.type === 'system'
                                                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                            : message.error
                                                                ? 'bg-red-50 text-red-800 border border-red-200'
                                                                : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                                                }`}>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>

                                                    {/* Model Info for System Messages */}
                                                    {message.type === 'system' && message.model && (
                                                        <div className="mt-3 pt-3 border-t border-blue-200 border-opacity-50">
                                                            <div className="flex items-center space-x-2 text-xs">
                                                                <span className="text-lg">{message.model.icon}</span>
                                                                <div>
                                                                    <div className="font-medium">{message.model.displayName}</div>
                                                                    <div className="text-blue-600">ขนาด: {message.model.size}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Attached Files */}
                                                    {message.files && message.files.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-purple-400 border-opacity-30">
                                                            <p className="text-xs opacity-80 mb-2">📎 ไฟล์ที่แนบ:</p>
                                                            <div className="space-y-1">
                                                                {message.files.map(file => (
                                                                    <div key={file.id} className="text-xs opacity-90">
                                                                        • {file.original_name || file.filename}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Chart */}
                                                    {message.chart && (
                                                        <div className="mt-3 p-3 bg-white bg-opacity-90 rounded-lg">
                                                            <DocumentTypeChart files={files} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Timestamp */}
                                                <p className="text-xs text-gray-500 mt-1 px-2 flex items-center justify-between">
                                                    <span>
                                                        {message.timestamp && new Date(message.timestamp).toLocaleTimeString('th-TH')}
                                                    </span>
                                                    {message.model && message.type === 'ai' && (
                                                        <span className="text-purple-600 font-medium">
                                                            {message.model}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm mr-12">
                                                <div className="flex items-center space-x-1">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {getCurrentModel() ? `${getCurrentModel().displayName} กำลังคิด...` : 'AI กำลังคิด...'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                        {/* Selected Files Indicator */}
                        {selectedFiles.length > 0 && (
                            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-purple-600 font-medium">📎 จะวิเคราะห์ไฟล์:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedFiles.slice(0, 3).map(file => (
                                            <span key={file.id} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                {(file.original_name || file.filename).slice(0, 20)}...
                                            </span>
                                        ))}
                                        {selectedFiles.length > 3 && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                +{selectedFiles.length - 3} อื่นๆ
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Box */}
                        <div className="p-6">
                            <div className="flex space-x-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder={
                                        !selectedModel ? 'กรุณาเลือกโมเดล AI ก่อนเริ่มสนทนา...' :
                                        'ถามเกี่ยวกับการตรวจสอบเอกสาร, สถิติ, หรือความน่าสงสัย...'
                                    }
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    disabled={isTyping || !selectedModel}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!currentInput.trim() || isTyping || !selectedModel}
                                    className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors font-medium ${
                                        !currentInput.trim() || isTyping || !selectedModel
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                                    }`}
                                >
                                    {isTyping ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>กำลังส่ง...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>ส่ง</span>
                                            <span>➤</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;