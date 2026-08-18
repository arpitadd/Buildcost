import React from 'react';

/**
 * ErrorBoundary Component for React
 * Catches rendering exceptions and provides a fallback to deterministic baseline metrics.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 border border-amber-500/40 rounded-2xl text-slate-200 space-y-3 my-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <span>⚠️</span> Rendering Issue Encountered
          </div>
          <p className="text-xs text-slate-400">
            An unexpected error occurred while rendering this component. You can safely continue using deterministic baseline numbers.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-white cursor-pointer"
            >
              Retry View
            </button>
            {this.props.onFallback && (
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onFallback();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-lg text-white cursor-pointer"
              >
                Switch to Baseline Numbers
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
