import type React from 'react';
import { useApp } from '../../context/AppContext';
import { NATURES } from '../../utils/party';
import { Select } from './Select';

export interface NatureSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function statAbbreviation(stat: string): string {
  const map: Record<string, string> = {
    attack: 'A',
    defense: 'B',
    sp_attack: 'C',
    sp_defense: 'D',
    speed: 'S',
  };
  return map[stat] || stat;
}

export const NatureSelect: React.FC<NatureSelectProps> = ({
  id,
  label,
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const { language } = useApp();

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block"
        >
          {label}
        </label>
      )}
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={className || 'py-1 text-xs font-semibold'}
      >
        {NATURES.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name[language]}
            {n.plus && n.minus
              ? ` (+${statAbbreviation(n.plus)} -${statAbbreviation(n.minus)})`
              : ''}
          </option>
        ))}
      </Select>
    </div>
  );
};
