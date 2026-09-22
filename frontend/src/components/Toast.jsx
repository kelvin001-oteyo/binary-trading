import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const pushToast = useCallback(
    (message, type = "info", duration = 3500) => {
      if (!message) return;

      const id = nextId++;

      setToasts((current) => [
        ...current,
        { id, message, type },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const value = {
    success: (msg, d) => pushToast(msg, "success", d),
    error: (msg, d) => pushToast(msg, "error", d),
    info: (msg, d) => pushToast(msg, "info", d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="status"
          >
            <div className="toast-icon">
              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                ? "!"
                : "i"}
            </div>

            <div className="toast-message">
              {toast.message}
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error(
      "useToast must be used inside a ToastProvider"
    );
  }

  return ctx;
}