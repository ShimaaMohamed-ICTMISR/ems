// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import { AppRouter } from './app/router';

// Import Bootstrap JS
import * as bootstrap from 'bootstrap';

// Make Bootstrap available globally
(window as any).bootstrap = bootstrap;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
