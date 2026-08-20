import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Master CSS System
import './css/variables.css';
import './css/components.css';
import './css/main.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
