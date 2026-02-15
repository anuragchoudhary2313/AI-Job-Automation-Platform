import React, { useState } from 'react';
import { X } from 'lucide-react';

// Custom Toast Implementation to replace 'sonner'
// This avoids module resolution issues by being zero-dependency.

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export const Toaster = () => {
  return <ToastDisplay />;
};

// Global event emitter for toast calls outside of React components
const toastListeners = new Set<(toast: Toast) => void>();

const notifyListeners = (toast: Toast) => {
  toastListeners.forEach(l => l(toast));
};

export const toast = {
  success: (msg: string) => notifyListeners({ id: Date.now().toString(), message: msg, type: 'success' }),
  error: (msg: string) => notifyListeners({ id: Date.now().toString(), message: msg, type: 'error' }),
  warning: (msg: string) => notifyListeners({ id: Date.now().toString(), message: msg, type: 'warning' }),
  info: (msg: string) => notifyListeners({ id: Date.now().toString(), message: msg, type: 'info' }),
  message: (msg: string) => notifyListeners({ id: Date.now().toString(), message: msg, type: 'info' }),
  dismiss: () => { }, // No-op for now
  loading: () => { },
  promise: () => { },
  custom: () => { },
};

export const useToast = () => {
  return {
    toast,
    dismiss: toast.dismiss
  }
};

// Internal component to display toasts
const ToastDisplay = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  React.useEffect(() => {
    const handler = (newToast: Toast) => {
      setToasts(prev => [...prev, newToast]);
      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };
    toastListeners.add(handler);
    return () => { toastListeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`
          p-4 rounded-md shadow-lg border text-sm font-medium flex items-center gap-2 min-w-[300px] animate-in slide-in-from-bottom-2
          ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' : ''}
          ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-900' : ''}
          ${t.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' : ''}
          ${t.type === 'info' ? 'bg-white border-gray-200 text-gray-900' : ''}
        `}>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(i => i.id !== t.id))} className="text-gray-500 hover:text-gray-900">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
