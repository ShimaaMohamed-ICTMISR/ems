// src/main.tsx
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import { AppRouter } from "./app/router";
import { AuthInitializer } from "./Components/AuthInitializer";
import { store } from "./store/store";

// Import Bootstrap JS
import * as bootstrap from "bootstrap";
import { Toaster } from "react-hot-toast";

// Make Bootstrap available globally
(window as any).bootstrap = bootstrap;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// Top-level component to initialize SSE

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
      <Toaster position="top-right" />
    </QueryClientProvider>
  </Provider>,
  // </StrictMode>
);
