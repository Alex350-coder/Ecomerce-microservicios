import React from 'react';
import '../../styles/ui/Card.css';

export const Card = ({ children, className = '', hover = false }) => {
  const cardClass = `card ${hover ? 'card--hover' : ''} ${className}`.trim();

  return (
    <div className={cardClass}>
      {children}
    </div>
  );
};