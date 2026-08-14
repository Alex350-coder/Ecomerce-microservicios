import type { ReactNode } from 'react';
import '../styles/templates/AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">{children}</div>
    </div>
  );
};
