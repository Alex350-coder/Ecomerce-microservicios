import type { ReactNode } from 'react';
import '../../styles/ui/Badge.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_MAP: Record<BadgeVariant, string> = {
  default: 'badge--default',
  success: 'badge--success',
  warning: 'badge--warning',
  error: 'badge--error',
  info: 'badge--info',
};

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const badgeClass = `badge ${VARIANT_MAP[variant]} ${className}`.trim();

  return <span className={badgeClass}>{children}</span>;
};
