import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0b0e',
          color: '#e6edf3',
          fontFamily: 'monospace',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: '#131722',
            border: '1px solid #c44b2b',
            borderRadius: '6px',
            padding: '24px'
          }}>
            <div style={{ color: '#ff6b6b', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              ⚠️ MBG QUANT TERMINAL // RUNTIME RECOVERY
            </div>
            <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '16px' }}>
              Terdeteksi pengecualian runtime saat memuat komponen antarmuka.
            </div>
            <pre style={{
              background: '#0a0b0e',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#f85149',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#00d084',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                🔄 REFRESH TERMINAL
              </button>
              <button
                onClick={() => {
                  try {
                    const keysToPreserve = [
                      'mbg_ai_arena_journal',
                      'mbg_ai_arena_positions',
                      'mbg_ai_arena_agents',
                      'mbg_ai_arena_epoch_reports',
                      'mbg_paper_portfolio',
                      'mbg_auth_session'
                    ];
                    const backup = {};
                    keysToPreserve.forEach(k => {
                      const v = localStorage.getItem(k);
                      if (v !== null) backup[k] = v;
                    });
                    localStorage.clear();
                    Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v));
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{
                  background: '#21262d',
                  color: '#c9d1d9',
                  border: '1px solid #30363d',
                  padding: '8px 16px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                🧹 RESET CACHE & RESTART
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

