import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console for now; could be sent to a logging endpoint
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const message = (this.state.error && this.state.error.message) || 'An unexpected error occurred.';
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#c82333' }}>Something went wrong</h2>
          <p>{message}</p>
          <details style={{ textAlign: 'left', margin: '1rem auto', maxWidth: '800px' }}>
            <summary>Technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error) + '\n' + (this.state.info && this.state.info.componentStack)}</pre>
          </details>
          <div>
            <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
