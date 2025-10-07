import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

// --- ✨ Icon Imports ---
import {
  LayoutDashboard, Search, BarChart2, Menu, X, ChevronsLeft, ChevronsRight,
  Files, CheckCircle, AlertTriangle, Clock, PieChart, Activity, Sun, Moon,
  MessageSquarePlus, Send, Minimize2, Maximize2, Bot, User, Loader
} from 'lucide-react';

// --- ✨ Chat Modal Component ---
const ChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', content: 'สวัสดี! มีอะไรให้ฉันช่วยไหมจ้ะ' }
    ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: generateBotResponse(inputMessage)
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('file') || message.includes('document')) {
      return 'Based on your current dashboard, you have uploaded several files. The system shows various processing statuses. Would you like me to analyze specific file patterns or processing efficiency?';
    } else if (message.includes('stat') || message.includes('analytic')) {
      return 'Your analytics show upload patterns throughout the day. The success rate and processing times vary based on file types. Would you like detailed insights on any specific metric?';
    } else if (message.includes('error') || message.includes('fail')) {
      return 'I can help you identify common failure patterns in your uploads. Most errors are related to file format compatibility or size limitations. Shall I provide troubleshooting steps?';
    } else if (message.includes('help')) {
      return 'I can assist with: 📊 Data analysis, 📈 Performance insights, 🔍 File processing status, ⚠️ Error diagnostics, 📋 Report generation. What specific area interests you?';
    } else {
      return 'That\'s an interesting question! I can analyze your dashboard data, explain trends, and provide insights about file processing, success rates, and system performance. How can I help you today?';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'}`}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Bot className="text-indigo-500" size={20} />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">AI Assistant</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {message.type === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600 dark:text-slate-300" />}
                    </div>
                    <div className={`p-3 rounded-2xl ${message.type === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="p-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <Bot size={16} className="text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700">
                      <Loader className="animate-spin text-slate-500" size={16} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about your dashboard data..."
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-slate-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- ✨ D3.js Charts ---
const D3PieChart = ({ data, width = 300, height = 300 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - 20;
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']);

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).transition().duration(200).attr('transform', 'scale(1.05)');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).transition().duration(200).attr('transform', 'scale(1)');
      });

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(d => d.data.value > 0 ? d.data.value : '');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

const D3BarChart = ({ data, width = 400, height = 200 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.time))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 1])
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.time))
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.count))
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', '#3B82F6')
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', '#1D4ED8');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('fill', '#3B82F6');
      });

    // X-axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#64748B')
      .style('font-size', '12px');

    // Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', '#64748B')
      .style('font-size', '12px');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

// --- ✨ StatCard Component ---
const StatCard = ({ title, value, icon: Icon, color, note, trend }) => (
  <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50 transform transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        {trend && (
          <p className={`text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color.bg}`}>
        <Icon className={color.text} size={24} />
      </div>
    </div>
    {note && <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{note}</p>}
  </div>
);

// --- ✨ Main Dashboard Component ---
const DashboardPage = ({
  files = [],
  suspiciousGroups = [],
  currentDate,
  currentTime,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  isDarkMode,
  themePreference,
  cycleThemePreference
}) => {
  const [showChat, setShowChat] = useState(false);
  const themeLabel = themePreference === 'dark' ? 'Dark' : themePreference === 'light' ? 'Light' : 'System';
  const ThemeIcon = isDarkMode ? Sun : Moon;

  // Real Data Processing
  const safeFiles = files || [];
  const safeSuspiciousGroups = suspiciousGroups || [];
  const today = new Date().toISOString().slice(0, 10);

  // Calculate real statistics
  const stats = useMemo(() => {
    const totalFiles = safeFiles.length;
    const todayFiles = safeFiles.filter(f => {
      const fileDate = f.uploadedAt || f.uploaded_at || '';
      return fileDate.includes(today);
    }).length;

    const processedFiles = safeFiles.filter(f => {
      const status = (f.processing_status || '').toLowerCase();
      return status === 'complete' || status === 'processed';
    }).length;

    const failedFiles = safeFiles.filter(f => {
      const status = (f.processing_status || '').toLowerCase();
      return status === 'failed' || status === 'error';
    }).length;

    const successRate = totalFiles > 0 ? Math.round((processedFiles / totalFiles) * 100) : 0;

    return {
      totalFiles,
      todayFiles,
      processedFiles,
      failedFiles,
      successRate,
      anomalyGroups: safeSuspiciousGroups.length
    };
  }, [safeFiles, safeSuspiciousGroups, today]);

  // Document type distribution
  const documentTypes = useMemo(() => {
    const types = {};
    safeFiles.forEach(file => {
      const ext = file.filename ? file.filename.split('.').pop()?.toLowerCase() : 'unknown';
      types[ext] = (types[ext] || 0) + 1;
    });

    return Object.entries(types).map(([label, value]) => ({ label, value }));
  }, [safeFiles]);

  // Upload timeline data
  const timelineData = useMemo(() => {
    const hours = ['09:00', '11:00', '13:00', '15:00', '17:00'];
    return hours.map(hour => {
      const count = safeFiles.filter(f => {
        const timestamp = f.uploadedAt || f.uploaded_at || '';
        return timestamp.includes(hour.replace(':', ''));
      }).length;
      return { time: hour, count };
    });
  }, [safeFiles]);

  // Processing status distribution
  const statusData = useMemo(() => {
    const statuses = {};
    safeFiles.forEach(file => {
      const status = file.processing_status || 'unknown';
      statuses[status] = (statuses[status] || 0) + 1;
    });

    return Object.entries(statuses).map(([label, value]) => ({ label, value }));
  }, [safeFiles]);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-100/50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col border-r border-slate-200 dark:border-slate-800 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className={`flex items-center justify-between p-4 h-20 border-b border-slate-200 dark:border-slate-800 ${sidebarCollapsed && 'lg:justify-center'}`}>
          {!sidebarCollapsed && <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            {sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { name: 'Home', icon: LayoutDashboard, page: 'home' },
            { name: 'Detection', icon: Search, page: 'groups' },
            { name: 'Analytics', icon: BarChart2, page: 'dashboard' },
          ].map(item => (
            <button 
              key={item.name} 
              onClick={() => { setCurrentPage(item.page); setSidebarOpen(false); }} 
              title={sidebarCollapsed ? item.name : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.page 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' 
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              } ${sidebarCollapsed && 'justify-center'}`}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-800 dark:text-slate-200">
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={cycleThemePreference}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Theme: ${themeLabel} (tap to change)`}
            >
              <ThemeIcon size={20} />
            </button>
            <div className="text-right">
              <div className="font-semibold text-slate-700 dark:text-slate-300">{currentDate}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{currentTime}</div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8 pb-24">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Documents" 
                value={stats.totalFiles} 
                icon={Files} 
                color={{ bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }} 
                note="All documents in system"
                trend={{ isPositive: true, value: 12 }}
              />
              <StatCard 
                title="Success Rate" 
                value={`${stats.successRate}%`} 
                icon={CheckCircle} 
                color={{ bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' }} 
                note={`${stats.processedFiles} files processed`}
                trend={{ isPositive: stats.successRate > 80, value: 5 }}
              />
              <StatCard 
                title="Anomaly Groups" 
                value={stats.anomalyGroups} 
                icon={AlertTriangle} 
                color={{ bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' }} 
                note="Groups needing review"
                trend={{ isPositive: false, value: 3 }}
              />
              <StatCard 
                title="Today's Uploads" 
                value={stats.todayFiles} 
                icon={Clock} 
                color={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }} 
                note="Files uploaded today"
                trend={{ isPositive: true, value: 8 }}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Document Types */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <PieChart size={20} className="text-indigo-500 dark:text-indigo-400" />
                  Document Types
                </h3>
                <div className="flex justify-center">
                  <D3PieChart data={documentTypes} width={250} height={250} />
                </div>
              </div>

              {/* Upload Timeline */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Activity size={20} className="text-indigo-500 dark:text-indigo-400" />
                  Upload Activity
                </h3>
                <div className="flex justify-center">
                  <D3BarChart data={timelineData} width={350} height={200} />
                </div>
              </div>

              {/* Processing Status */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <BarChart2 size={20} className="text-indigo-500 dark:text-indigo-400" />
                  Processing Status
                </h3>
                <div className="flex justify-center">
                  <D3PieChart data={statusData} width={250} height={250} />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/50">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {safeFiles.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent files uploaded.</p>
                ) : (
                  safeFiles.slice(0, 8).map((file, idx) => (
                    <div key={file.id || idx} className="flex justify-between items-center py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg px-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          file.processing_status === 'complete' ? 'bg-green-500' :
                          file.processing_status === 'processing' ? 'bg-blue-500' :
                          file.processing_status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{file.filename || 'Unnamed File'}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {file.company_name || 'Unknown Company'} • {file.processing_status || 'Unknown Status'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(file.uploadedAt || file.uploaded_at || Date.now()).toLocaleString('en-US', { 
                          timeStyle: 'short', 
                          dateStyle: 'short' 
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} />

      {/* Chat FAB */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transform transition-all hover:scale-110 z-40"
        title="Chat with AI Assistant"
      >
        <MessageSquarePlus size={24} />
      </button>
    </div>
  );
};

export default DashboardPage;
