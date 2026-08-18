import type React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  className = '',
  ...props
}) => {
  const computedClassName = `input-premium ${className}`.trim();

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
      <input id={id} className={computedClassName} {...props} />
    </div>
  );
};
