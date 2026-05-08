'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type ToastContextValue = { notify: (message: string) => void };
const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const value = useMemo(() => ({
    notify: (next: string) => {
      setMessage(next);
      window.setTimeout(() => setMessage(''), 2600);
    },
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-glass">
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
