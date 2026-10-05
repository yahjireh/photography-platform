import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

try {
  CapacitorUpdater.notifyAppReady().catch((e) => {
    console.warn('[Capgo] notifyAppReady rejected:', e);
  });
} catch (e) {
  console.warn('[Capgo] notifyAppReady sync error:', e);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CRITICAL: App caught global error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#115E59',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: '#2DD4BF',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            CF
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
            ClickFlicks Studio
          </h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px', maxWidth: '300px', lineHeight: '1.5' }}>
            A temporary display error occurred during launch. Tap below to reload.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#0F766E',
                color: '#fff',
                padding: '14px 20px',
                borderRadius: '14px',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reload App
            </button>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#9CA3AF',
                padding: '12px 20px',
                borderRadius: '14px',
                fontWeight: '600',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reset Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
