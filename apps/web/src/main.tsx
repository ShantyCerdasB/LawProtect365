import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/routing/router';
import './i18n/config/i18n.web';
import './style.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </React.StrictMode>
  );
}

