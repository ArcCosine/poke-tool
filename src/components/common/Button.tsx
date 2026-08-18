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
        'w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 rounded-2xl text-slate-500 hover:text-indigo-500';
      break;
    case 'danger':
      variantStyle =
        'p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-xs';
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
