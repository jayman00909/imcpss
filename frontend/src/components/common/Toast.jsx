import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  error: { bg: '#fdecea', border: '#f5c6cb', text: '#c0392b', icon: '⚠️' },
  success: { bg: '#eafaf1', border: '#a3e4c1', text: '#1e7e45', icon: '✅' },
  info: { bg: '#EBF5FB', border: '#bcd9f0', text: '#1A3A6B', icon: 'ℹ️' },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={styles.container} aria-live="polite">
        {toasts.map((t) => {
          const s = TYPE_STYLES[t.type] || TYPE_STYLES.error;
          return (
            <div
              key={t.id}
              role="alert"
              style={{ ...styles.toast, background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
              onClick={() => dismiss(t.id)}
            >
              <span style={styles.icon}>{s.icon}</span>
              <span style={styles.message}>{t.message}</span>
              <button
                style={{ ...styles.close, color: s.text }}
                onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '360px',
  },
  toast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    fontSize: '14px',
    cursor: 'pointer',
    animation: 'imcpss-toast-in 0.2s ease-out',
  },
  icon: { fontSize: '16px', lineHeight: '20px' },
  message: { flex: 1, lineHeight: '20px' },
  close: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    lineHeight: '18px',
    cursor: 'pointer',
    padding: 0,
    opacity: 0.6,
  },
};
