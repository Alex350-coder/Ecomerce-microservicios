import type { ReactNode } from 'react';
import '../../styles/ui/Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  const cardClass = `card ${hover ? 'card--hover' : ''} ${className}`.trim();

  return <div className={cardClass}>{children}</div>;
};
