import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'antd/dist/reset.css';
import { loader } from '@monaco-editor/react';

// Tell Monaco where to find its “vs” folder in public/
loader.config({
  paths: {
    vs: '/monaco/vs'
  }
});

// Suppress ResizeObserver warnings
const observerErrorHandler = (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
  }
};
window.addEventListener('error', observerErrorHandler);
window.addEventListener('unhandledrejection', observerErrorHandler);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
