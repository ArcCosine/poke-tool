import type React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  calculateDurabilityIndices,
  optimizeHbdEvs,
} from '../../utils/durability';
import { getCalculatedStat, stepToEv } from '../../utils/party';
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
  const { language } = useApp();
  const [style, setStyle] = useState<'balance' | 'performance'>('balance');

  // Calculate current real stats (Level 50, IV 31)
  const currentRealH = getCalculatedStat(
    'hp',
    baseStats.hp,
    stepToEv(currentEvs.hp),
    nature
  );
  const currentRealB = getCalculatedStat(
    'defense',
    baseStats.defense,
    stepToEv(currentEvs.defense),
    nature
  );
  const currentRealD = getCalculatedStat(
    'sp_defense',
    baseStats.sp_defense,
    stepToEv(currentEvs.sp_defense),
    nature
  );

  const indices = calculateDurabilityIndices(
    currentRealH,
    currentRealB,
    currentRealD
  );

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
    <div className="card-premium relative z-10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="i-lucide-shield text-indigo-500" />
          {language === 'ja' ? '耐久指数' : 'Durability Index'}
        </h3>
      </div>

      {/* Durability Indices Display */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            {language === 'ja' ? '物理' : 'Physical'}
          </span>
          <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200">
            {indices.physical.toLocaleString()}
          </span>
        </div>
        <div className="text-center border-x border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
            {language === 'ja' ? '特殊' : 'Special'}
          </span>
          <span className="text-sm sm:text-base font-black text-slate-700 dark:text-slate-200">
            {indices.special.toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
            {language === 'ja' ? '総合' : 'Total'}
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
          {language === 'ja' ? '耐久調整' : 'Durability Tuning'}
        </h4>

        {/* Styles */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {language === 'ja' ? 'スタイル' : 'Optimization Style'}
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
              <span>
                {language === 'ja'
                  ? 'バランス (HBD/(B+D))'
                  : 'Balance (HBD/(B+D))'}
              </span>
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
              <span>
                {language === 'ja' ? '総合重視 (H=B+D)' : 'Overall (H=B+D)'}
              </span>
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
          {language === 'ja' ? 'HBDへの最適配分を計算' : 'Optimize HBD EVs'}
        </Button>
      </div>
    </div>
  );
};
