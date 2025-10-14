import React from 'react';
import '../../styles/ui/Button.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  type = 'button',
  disabled = false,
  onClick,
  className = ''
}) => {
  const buttonClass = `btn btn--${variant} btn--${size} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};