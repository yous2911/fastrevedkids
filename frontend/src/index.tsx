import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals, { monitorWebVitals } from './reportWebVitals';
import { initializeSentry } from './utils/sentry';
import { customPerformanceObserver } from './utils/performanceObserver';

// Initialize Sentry
initializeSentry();

// Initialize Web Vitals monitoring
monitorWebVitals();

// Initialize custom performance observer
customPerformanceObserver;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
