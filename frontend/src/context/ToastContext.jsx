import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = 'success') => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed inset-x-3 top-20 z-50 flex flex-col gap-2 pointer-events-none sm:right-4 sm:left-auto sm:max-w-sm sm:w-full"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3 sm:p-4 rounded-xl shadow-lg border flex items-start gap-2 pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-white border border-emerald-500'
                : 'bg-white border border-red-500'
            }`}
            role="status"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 leading-5">{toast.title}</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-4 break-words">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
