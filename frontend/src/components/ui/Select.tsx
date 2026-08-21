import type { SelectHTMLAttributes, ReactNode } from 'react';
import '../../styles/ui/Select.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const Select = ({
  label,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  id,
  ...props
}: SelectProps) => {
  return (
    <div className="select-container">
      {label && (
        <label htmlFor={id} className="select-label">
          {label}
        </label>
      )}
      <div className="select-wrapper">
        <select id={id} className={`select ${className}`.trim()} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="select-chevron" aria-hidden="true">
          ▾
        </span>
      </div>
    </div>
  );
};
