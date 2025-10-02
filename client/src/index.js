import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';  // <-- Import this

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>  {/* <-- Wrap App here */}
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

// Your existing observer error handler remains the same
const observerErrorHandler = () => {
  const error = "ResizeObserver loop completed with undelivered notifications.";
  const ignoreResizeObserverErr = (e) => {
    if (e.message === error) {
      e.stopImmediatePropagation();
    }
  };
  window.addEventListener("error", ignoreResizeObserverErr);
};

observerErrorHandler();
