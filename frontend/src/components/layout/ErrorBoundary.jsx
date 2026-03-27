import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error logged by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-[#0A2353] flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-white text-3xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Something went wrong.</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            An unexpected error occurred in the application. Please refresh the page or contact support if the problem persists.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[linear-gradient(135deg,_#03ccff,_#09fbff,_#d403e1)] text-white rounded hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 text-left bg-black p-4 rounded-lg overflow-auto max-w-3xl border border-red-500">
              <p className="text-red-400 font-mono text-sm">{this.state.error.toString()}</p>
              <pre className="text-gray-500 font-mono text-xs mt-2">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
