import { useState, useEffect } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (message, type = 'success') => {
    setToast({ message, type });
  };

  return { toast, show, setToast };
}

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(t);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <div className={`${colors[toast.type] || colors.info} text-white px-4 py-3 rounded-xl shadow-lg text-sm max-w-xs`}>
        {toast.message}
      </div>
    </div>
  );
}
