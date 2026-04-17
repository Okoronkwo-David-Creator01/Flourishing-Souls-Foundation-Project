import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Production-ready entrypoint: hydrate the app at real DOM root.
// Use React 18+ root API for concurrent rendering and improved performance.
const container = document.getElementById("root");

if (!container) {
  // Fail fast and loud for production diagnostics
  throw new Error(
    'Could not find root DOM element with id="root". Please ensure public/index.html contains <div id="root"></div>.'
  );
}

// In production, prefer strict mode + concurrent root
const root = createRoot(container);
root.render(<App />);

// Hot Module Replacement (for dev, Vite or Webpack handle replace)
if (import.meta && import.meta.hot) {
  import.meta.hot.accept();
}

