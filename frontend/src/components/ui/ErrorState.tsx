import { Button } from './Button';
import '../../styles/ui/ErrorState.css';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState = ({
  title = 'Algo salió mal',
  message,
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
}: ErrorStateProps) => (
  <div className={`error-state ${className}`.trim()} role="alert">
    <span className="error-state__icon" aria-hidden="true">
      ⚠️
    </span>
    <h3 className="error-state__title">{title}</h3>
    <p className="error-state__message">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);
