import type React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateDurabilityIndices,
  optimizeHbdEvs,
} from '../../utils/durability';
import { getCalculatedStat } from '../../utils/party';
import { Button } from '../common/Button';

interface DurabilityOptimizerProps {
  baseStats: {
    hp: number;
    defense: number;
    sp_defense: number;
  };
  currentEvs: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
  nature: string;
  onApplyHbdEvs: (hbd: {
    hp: number;
    defense: number;
    sp_defense: number;
  }) => void;
}

export const DurabilityOptimizer: React.FC<DurabilityOptimizerProps> = ({
  baseStats,
  currentEvs,
  nature,
  onApplyHbdEvs,
}) => {
  const { t } = useApp();
  const [style, setStyle] = useState<'balance' | 'performance'>('balance');

  // Calculate current real stats (Level 50, IV 31)
  const currentRealH = getCalculatedStat(
    'hp',
    baseStats.hp,
    currentEvs.hp,
    nature
  );
  const currentRealB = getCalculatedStat(
    'defense',
    baseStats.defense,
    currentEvs.defense,
    nature
  );
  const currentRealD = getCalculatedStat(
    'sp_defense',
    baseStats.sp_defense,
    currentEvs.sp_defense,
    nature
  );

  const indices = calculateDurabilityIndices(
    currentRealH,
    currentRealB,
    currentRealD
  );

  // Handle optimal allocation click
  const handleOptimize = () => {
    const otherEvsTotal =
      (currentEvs.attack || 0) +
      (currentEvs.sp_attack || 0) +
      (currentEvs.speed || 0);

    const optimal = optimizeHbdEvs({
      baseStats,
      nature,
      otherEvsTotal,
      modifier: {
        defense: 1.0,
        spDefense: 1.0,
        style,
      },
    });

    onApplyHbdEvs(optimal);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="i-lucide-shield text-indigo-500" />
          {t('evCalculator.durability.index')}
        </h3>
      </div>

      {/* Durability Indices Display */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            {t('evCalculator.durability.physical')}
          </span>
          <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200">
            {indices.physical.toLocaleString()}
          </span>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            {t('evCalculator.durability.special')}
          </span>
          <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200">
            {indices.special.toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
            {t('evCalculator.durability.total')}
          </span>
          <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
            {indices.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Adjustment Options */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <span className="i-lucide-settings-2 text-slate-400 text-sm" />
          {t('evCalculator.durability.tuning')}
        </h4>

        {/* Styles */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('evCalculator.durability.style')}
          </span>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
              <input
                type="radio"
                name="durability-style"
                value="balance"
                checked={style === 'balance'}
                onChange={() => setStyle('balance')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span>{t('evCalculator.durability.balance')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
              <input
                type="radio"
                name="durability-style"
                value="performance"
                checked={style === 'performance'}
                onChange={() => setStyle('performance')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span>{t('evCalculator.durability.overall')}</span>
            </label>
          </div>
        </div>

        {/* Optimize Button */}
        <Button
          type="button"
          variant="secondary"
          onClick={handleOptimize}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition cursor-pointer"
        >
          <span className="i-lucide-sparkles text-base" />
          {t('evCalculator.durability.optimizeButton')}
        </Button>
      </div>
    </div>
  );
};
