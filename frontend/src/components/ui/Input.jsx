import React from 'react';
import '../../styles/ui/Input.css';

export const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  id,
  label,
  ...props
}) => {
  return (
    <div className="input-container">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input ${className}`}
        {...props}
      />
    </div>
  );
};
