// src/components/ErrorBoundary.jsx - Error Boundary Component
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                เกิดข้อผิดพลาด
              </h1>
              <p className="text-gray-600 mb-6">
                เกิดข้อผิดพลาดที่ไม่คาดคิดขึ้น กรุณาลองรีเฟรชหน้าเว็บ
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  รีเฟรชหน้าเว็บ
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  ลองอีกครั้ง
                </button>
              </div>

              {/* แสดงรายละเอียด error ใน development mode */}
              {window.location.hostname === 'localhost' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-red-600 font-medium mb-2">
                    รายละเอียดข้อผิดพลาด (Development Mode)
                  </summary>
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-sm">
                    <div className="font-medium text-red-800 mb-2">Error:</div>
                    <div className="text-red-700 mb-4 font-mono text-xs">
                      {this.state.error && this.state.error.toString()}
                    </div>
                    
                    <div className="font-medium text-red-800 mb-2">Stack Trace:</div>
                    <pre className="text-red-700 font-mono text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;