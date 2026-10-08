import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { isChunkLoadFailure, shouldRetryChunkLoad, clearRetryGuard, CHUNK_RETRY_KEY } from './services/chunkLoadRetry.js'

// ---------------------------------------------------------------------------
// A failed dynamic import is almost always a transient network blip, not a
// broken build.
//
// Observed in production 2026-10-06: the recovery screen appeared for
// SecurityHubDrawer-C8h4s3MP.js. That chunk was sitting on the CDN answering
// HTTP 200 the whole time, and all nine chunks the main bundle references were
// present. The request simply failed once and React never asked again.
//
// Why it took down the WHOLE app: every `lazy()` import rejects into the nearest
// error boundary, and this boundary is the root. So one dropped request for a
// 24 KB drawer replaced the entire terminal with an error screen.
//
// The fix belongs here, not at the 28 `lazy()` call sites. This is the choke
// point they all route through, and a reload is a legitimate recovery for a
// transient failure: it re-reads index.html and re-issues the import.
//
// The decision logic lives in services/chunkLoadRetry.js so it can be tested
// without booting React.
// ---------------------------------------------------------------------------

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retrying: false };
    this.clearGuardTimer = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Only a chunk-load failure may trigger a reload. A genuine render bug that
    // reloads on every render is an infinite loop.
    const { retry } = shouldRetryChunkLoad(error);
    if (!retry) return;

    this.setState({ retrying: true });
    window.location.reload();
  }

  componentDidMount() {
    // Clear the guard once the app has settled, so a later failure in the same
    // session can retry again. Delayed on purpose: React commits the Suspense
    // fallback first, so clearing on mount would fire while chunks are still in
    // flight and defeat the guard entirely.
    this.clearGuardTimer = setTimeout(() => clearRetryGuard(), 15000);
  }

  componentWillUnmount() {
    if (this.clearGuardTimer) clearTimeout(this.clearGuardTimer);
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
              {this.state.retrying
                ? 'Koneksi terputus saat memuat komponen. Memuat ulang otomatis...'
                : isChunkLoadFailure(this.state.error)
                  ? 'Gagal memuat satu komponen antarmuka. Coba muat ulang dulu — biasanya hanya gangguan jaringan sebentar.'
                  : 'Terdeteksi pengecualian runtime saat memuat komponen antarmuka.'}
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
                    // Clear the automatic-retry guard too. Without this the manual
                    // reset still cannot re-attempt the failed chunk, because the
                    // guard lives in sessionStorage and localStorage.clear() does
                    // not touch it.
                    sessionStorage.removeItem(CHUNK_RETRY_KEY);
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
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

