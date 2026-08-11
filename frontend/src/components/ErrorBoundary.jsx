import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // keep full details in console for debugging
    // and store minimal info for the UI
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
    this.setState({ info });
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl">
          <h3 className="text-sm font-bold text-red-700">An unexpected error occurred</h3>
          <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">{String(error && (error.message || error))}</pre>
          {info?.componentStack && (
            <details className="mt-2 text-xs text-red-500">
              <summary className="cursor-pointer">Component stack</summary>
              <pre className="whitespace-pre-wrap">{info.componentStack}</pre>
            </details>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null, info: null })}
              className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
