// @ts-nocheck
// src/index
// Application entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeMsal } from './msalInit';

initializeMsal().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
