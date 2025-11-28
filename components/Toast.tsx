import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'error', 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500 flex-shrink-0" />;
      case 'info':
        return <Info size={20} className="text-blue-500 flex-shrink-0" />;
      case 'error':
      default:
        return <AlertCircle size={20} className="text-red-500 flex-shrink-0" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'error':
      default:
        return 'bg-red-500/10 border-red-500/30';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'info':
        return 'text-blue-500';
      case 'error':
      default:
        return 'text-red-500';
    }
  };

  return (
    <div 
      className={`${getStyles()} border rounded-xl p-4 flex items-start gap-3 shadow-lg animate-slide-up`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1">
        <p className={`${getTextColor()} text-sm font-medium`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-muted hover:text-main transition-colors flex-shrink-0"
        aria-label="Zamknij powiadomienie"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
