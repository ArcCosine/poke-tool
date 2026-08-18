import type React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  className = '',
  children,
  ...props
}) => {
  const computedClassName = `input-premium cursor-pointer ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-500 mb-1"
        >
          {label}
        </label>
      )}
      <select id={id} className={computedClassName} {...props}>
        {children}
      </select>
    </div>
  );
};
