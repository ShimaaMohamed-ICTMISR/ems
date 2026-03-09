// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import { AppRouter } from './app/router';
import { AuthInitializer } from './Components/AuthInitializer';
import { store } from './store/store';

// Import Bootstrap JS
import * as bootstrap from 'bootstrap';

// Make Bootstrap available globally
(window as any).bootstrap = bootstrap;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
    </Provider>
  </StrictMode>
);
