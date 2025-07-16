// src/services/AIService.js - AI Integration Service for Document Analysis
class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_AI_API_KEY;
    this.provider = process.env.REACT_APP_AI_PROVIDER || 'mock'; // 'openai', 'claude', 'gemini', 'local', 'mock'
    this.baseURL = this.getBaseURL();
    this.model = this.getModel();
  }

  getBaseURL() {
    switch (this.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'claude':
        return 'https://api.anthropic.com/v1';
      case 'gemini':
        return 'https://generativelanguage.googleapis.com/v1beta';
      case 'local':
        return process.env.REACT_APP_LOCAL_AI_URL || 'http://localhost:11434'; // Ollama default
      case 'mock':
        return null; // Use mock responses
      default:
        // return 'http://localhost:3001/api/ai'; // Custom backend AI endpoint
    }
}
}