import type React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dashed' | 'danger' | 'ghost';
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  className = '',
  ...props
}) => {
  // 既存のスタイリングに基づき、適切なクラスを適用
  const baseStyle =
    'transition duration-200 cursor-pointer font-semibold flex items-center justify-center gap-2';

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'btn-primary';
      break;
    case 'secondary':
      variantStyle = 'btn-secondary';
      break;
    case 'dashed':
      variantStyle =
        'w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400';
      break;
    case 'danger':
      variantStyle =
        'p-1.5 rounded-lg border border-red-300 hover:border-red-400 dark:border-red-800 dark:hover:border-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/70 text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200 text-xs';
      break;

    case 'ghost':
      variantStyle =
        'appearance-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 focus-visible:outline-none select-none text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ml-auto inline-flex items-center gap-1 cursor-default';
      break;
  }

  // クラス名を構築（二重の空白を防ぐ）
  const computedClassName = [baseStyle, variantStyle, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={computedClassName} {...props}>
      {icon && <span className={icon} />}
      {children}
    </button>
  );
};
