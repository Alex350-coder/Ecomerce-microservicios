import type { ReactNode, ButtonHTMLAttributes } from 'react';
import '../../styles/ui/Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  isLoading = false,
  className = '',
  ...rest
}: ButtonProps) => {
  const buttonClass = `btn btn--${variant} btn--${size} ${className}`.trim();

  return (
    <button type={type} className={buttonClass} disabled={disabled || isLoading} {...rest}>
      {isLoading ? 'Cargando...' : children}
    </button>
  );
};
