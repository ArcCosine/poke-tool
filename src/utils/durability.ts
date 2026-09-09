import { getCalculatedStat, stepToEv } from './party';

export interface DurabilityModifier {
  defense: number;
  spDefense: number;
  style: 'balance' | 'performance';
}

export interface DurabilityIndices {
  physical: number;
  special: number;
  total: number;
}

export interface OptimizeHbdParams {
  baseStats: {
    hp: number;
    defense: number;
    sp_defense: number;
  };
  nature: string;
  otherEvsTotal: number;
  modifier: DurabilityModifier;
}

export interface OptimizedHbdResult {
  hp: number;
  defense: number;
  sp_defense: number;
}

/**
 * 耐久指数の計算
 * - 物理耐久指数 = HP * floor(防御 * 防御倍率)
 * - 特殊耐久指数 = HP * floor(特防 * 特防倍率)
 * - 総合耐久指数 = 物理耐久指数 + 特殊耐久指数
 */
export function calculateDurabilityIndices(
  hp: number,
  defense: number,
  spDefense: number,
  defenseMultiplier = 1.0,
  spDefenseMultiplier = 1.0
): DurabilityIndices {
  const effB = Math.floor(defense * defenseMultiplier);
  const effD = Math.floor(spDefense * spDefenseMultiplier);
  const physical = hp * effB;
  const special = hp * effD;
  return {
    physical,
    special,
    total: physical + special,
  };
}

/**
 * HBDへの最適努力値（ステップ）配分の探索
 * - 対象ポケモンの H, B, D の実数値を全探索して評価スコアを最大化する (h, b, d) を算出
 * - style === 'balance': score = (H * effB * effD) / (effB + effD)
 * - style === 'performance': score = H * (effB + effD), タイブレークは |effB - effD| が最小
 */
export function optimizeHbdEvs({
  baseStats,
  nature,
  otherEvsTotal,
  modifier,
}: OptimizeHbdParams): OptimizedHbdResult {
  const maxAvailable = Math.max(0, 66 - otherEvsTotal);
  if (maxAvailable <= 0) {
    return { hp: 0, defense: 0, sp_defense: 0 };
  }

  const perStatLimit = 32;
  const targetTotal = Math.min(maxAvailable, perStatLimit * 3);

  let bestScore = -1;
  let bestH = 0;
  let bestDiff = Infinity;
  let bestResult: OptimizedHbdResult = { hp: 0, defense: 0, sp_defense: 0 };

  const maxH = Math.min(perStatLimit, targetTotal);

  for (let hStep = maxH; hStep >= 0; hStep--) {
    const realH = getCalculatedStat(
      'hp',
      baseStats.hp,
      stepToEv(hStep),
      nature
    );

    const remBD = targetTotal - hStep;
    const maxD = Math.min(perStatLimit, remBD);

    for (let dStep = maxD; dStep >= 0; dStep--) {
      const bStep = remBD - dStep;
      if (bStep > perStatLimit || bStep < 0) continue;

      const realB = getCalculatedStat(
        'defense',
        baseStats.defense,
        stepToEv(bStep),
        nature
      );
      const realD = getCalculatedStat(
        'sp_defense',
        baseStats.sp_defense,
        stepToEv(dStep),
        nature
      );

      const effB = Math.floor(realB * modifier.defense);
      const effD = Math.floor(realD * modifier.spDefense);

      let score = 0;
      if (modifier.style === 'balance') {
        const sumBD = effB + effD;
        score = sumBD === 0 ? 0 : (realH * effB * effD) / sumBD;
      } else {
        score = realH * (effB + effD);
      }

      if (score > bestScore) {
        bestScore = score;
        bestH = realH;
        bestDiff = Math.abs(effB - effD);
        bestResult = { hp: hStep, defense: bStep, sp_defense: dStep };
      } else if (
        modifier.style === 'performance' &&
        Math.abs(score - bestScore) < 1e-9 &&
        bestH === realH
      ) {
        const diff = Math.abs(effB - effD);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestResult = { hp: hStep, defense: bStep, sp_defense: dStep };
        }
      }
    }
  }

  return bestResult;
}
