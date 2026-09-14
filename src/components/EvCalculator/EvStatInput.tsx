import type React from 'react';

export interface EvStatInputProps {
  stat: string;
  value: number;
  maxAllowed: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export const EvStatInput: React.FC<EvStatInputProps> = ({
  stat,
  value,
  maxAllowed,
  onChange,
  min = 0,
  max = 32,
  disabled = false,
}) => {
  const currentMax = Math.min(max, maxAllowed);

  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < currentMax) {
      onChange(value + 1);
    }
  };

  const handleReset = () => {
    onChange(min);
  };

  const handleMax = () => {
    onChange(currentMax);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseInt(e.target.value, 10);
    if (Number.isNaN(rawVal)) {
      onChange(min);
      return;
    }
    const clamped = Math.max(min, Math.min(currentMax, rawVal));
    onChange(clamped);
  };

  const isMin = value <= min;
  const isMax = value >= currentMax || currentMax <= min;

  return (
    <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-1.5 bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 w-full sm:w-fit">
      {/* 0 (最小値) 専用ボタン */}
      <button
        type="button"
        onClick={handleReset}
        disabled={disabled || isMin}
        aria-label="0"
        title="0にリセット"
        className="h-9 sm:h-8 flex-1 sm:flex-initial sm:min-w-[34px] px-2 flex items-center justify-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
      >
        0
      </button>

      {/* -1 専用ボタン */}
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || isMin}
        aria-label="-1"
        title="1減らす"
        className="h-9 sm:h-8 flex-1 sm:flex-initial sm:min-w-[34px] px-2 flex items-center justify-center text-xs font-extrabold rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
      >
        -1
      </button>

      {/* 数値入力欄 */}
      <input
        id={`ev-input-${stat}`}
        aria-label={stat}
        type="number"
        min={min}
        max={currentMax}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className="h-9 sm:h-8 w-14 sm:w-12 text-center text-sm font-black bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 shadow-inner box-border"
      />

      {/* +1 専用ボタン */}
      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || isMax}
        aria-label="+1"
        title="1増やす"
        className="h-9 sm:h-8 flex-1 sm:flex-initial sm:min-w-[34px] px-2 flex items-center justify-center text-xs font-extrabold rounded-lg border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
      >
        +1
      </button>

      {/* 32 (最大値) 専用ボタン */}
      <button
        type="button"
        onClick={handleMax}
        disabled={disabled || isMax}
        aria-label="32"
        title="最大値に設定"
        className="h-9 sm:h-8 flex-1 sm:flex-initial sm:min-w-[34px] px-2 flex items-center justify-center text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
      >
        32
      </button>
    </div>
  );
};
