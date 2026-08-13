import React from 'react';
import '../styles/templates/AuthLayout.css';

export const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">{children}</div>
    </div>
  );
};
