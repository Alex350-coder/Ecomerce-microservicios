import type { ReactNode } from 'react';
import '../../styles/ui/EmptyState.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon = '📦',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => (
  <div className={`empty-state ${className}`.trim()} role="status">
    <span className="empty-state__icon" aria-hidden="true">
      {icon}
    </span>
    <h3 className="empty-state__title">{title}</h3>
    {description && <p className="empty-state__description">{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);
