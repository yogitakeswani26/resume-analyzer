import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error details to console for debugging
    console.error('ErrorBoundary caught an error:');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Stack Trace:', error.stack);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Error Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-blue-500/30 rounded-2xl shadow-2xl p-8 space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center border border-red-500/30">
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4v2m0 4v2M8.228 15h8M6 11h12M4 7h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Title */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-300 text-sm">
                  We encountered an unexpected error. Please try again.
                </p>
              </div>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="bg-slate-900/40 border border-red-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-red-300 font-mono text-xs font-semibold">
                    Error Message:
                  </p>
                  <p className="text-red-200 font-mono text-xs break-words">
                    {error.toString()}
                  </p>

                  {errorInfo && (
                    <>
                      <p className="text-yellow-300 font-mono text-xs font-semibold mt-3">
                        Component Stack:
                      </p>
                      <pre className="text-yellow-200 font-mono text-xs overflow-auto max-h-32 whitespace-pre-wrap break-words">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-blue-500/50"
                >
                  Try Again
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-6 py-3 bg-slate-800/40 hover:bg-slate-800/60 border border-blue-400/30 text-blue-300 hover:text-blue-200 font-semibold rounded-lg transition duration-200"
                >
                  Go to Home
                </button>
              </div>

              {/* Support Info */}
              <div className="text-center text-xs text-gray-400 pt-4 border-t border-blue-500/20">
                <p>If the problem persists, please contact support or try refreshing the page.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
