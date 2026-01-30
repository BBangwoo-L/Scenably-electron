'use client';

import { useEffect } from 'react';
import { useToastStore } from '@/stores/toast-store';
import { Button } from '@/shared/ui/button';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const Toast = ({ toast, onRemove }: { toast: any; onRemove: (id: string) => void }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const IconComponent = icons[toast.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
        colors[toast.type]
      )}
    >
      <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="font-medium text-sm mb-1">{toast.title}</h4>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-black/10"
        onClick={() => onRemove(toast.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}