import type React from 'react';
import { useApp } from '../../context/AppContext';
import { typeTranslations } from '../../utils/pokemon';

interface TypeBadgeProps {
  typeKey: string;
  showText?: boolean;
  responsiveText?: boolean;
  className?: string;
  imgClassName?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({
  typeKey,
  showText = true,
  responsiveText = false,
  className = '',
  imgClassName = '',
}) => {
  const { language } = useApp();
  const label = typeTranslations[typeKey]?.[language] || typeKey;

  const baseClass =
    `inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none ${className}`.trim();
  const baseImgClass = `w-4 h-4 object-contain shrink-0 ${imgClassName}`.trim();

  return (
    <span className={baseClass}>
      <img
        src={`/assets/type-icons/${typeKey}.svg`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
        alt={label}
        className={baseImgClass}
        loading="lazy"
      />
      {showText && (
        <span className={responsiveText ? 'hidden sm:inline' : ''}>
          {label}
        </span>
      )}
    </span>
  );
};
