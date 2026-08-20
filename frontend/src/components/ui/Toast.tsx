import { useEffect } from 'react';
import '../../styles/ui/Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export const Toast = ({ message, type = 'info', duration = 4000, onDismiss }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <span className="toast__icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={onDismiss} aria-label="Cerrar notificación">
        ×
      </button>
    </div>
  );
};
