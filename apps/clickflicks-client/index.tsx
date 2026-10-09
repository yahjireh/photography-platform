import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Capacitor } from '@capacitor/core';
import { OtaKit } from '@otakit/capacitor-updater';

// Notify OtaKit that client app loaded successfully to confirm update
if (Capacitor.isNativePlatform()) {
  OtaKit.notifyAppReady().catch((e) => {
    console.warn('[OtaKit] notifyAppReady rejected:', e);
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
