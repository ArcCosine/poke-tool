import type React from 'react';

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  inputClassName?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const wrapperClass =
    `flex items-center gap-2 text-slate-700 dark:text-slate-300 ${className}`.trim();
  const inputClass =
    `w-4 h-4 text-indigo-650 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer ${inputClassName}`.trim();

  return (
    <div className={wrapperClass}>
      <input id={id} type="checkbox" className={inputClass} {...props} />
      <label
        htmlFor={id}
        className="text-sm font-semibold select-none cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
};
