# 計画書: 火力ランキングにおける反動技（1ターン動けなくなる技）除外フィルタの追加

## 1. 概要
火力ランキングにおいて、はかいこうせん、ギガインパクト、ハイドロカノンなどの「使用した次のターンに行動不能になる反動技（Recharge moves）」を除外できるフィルタチェックボックスを追加する。
「メガポケモンを除く」のチェックボックスの隣に「反動技を除く」チェックボタンを配置し、チェックが入っている場合はこれらの技によるダメージ計算結果をランキングから除外する。

---

## 2. 対象となる反動技の定義
次のターンに行動不能（反動で動けなくなる）技を対象とする：
- **はかいこうせん** (Hyper Beam, ID: 63) - ノーマル / 特殊 / 威力150
- **ブラストバーン** (Blast Burn, ID: 307) - ほのお / 特殊 / 威力150
- **ハイドロカノン** (Hydro Cannon, ID: 308) - みず / 特殊 / 威力150
- **ハードプラント** (Frenzy Plant, ID: 338) - くさ / 特殊 / 威力150
- **ギガインパクト** (Giga Impact, ID: 416) - ノーマル / 物理 / 威力150
- **がんせきほう** (Rock Wrecker, ID: 439) - いわ / 物理 / 威力150
- **ときのほうこう** (Roar of Time, ID: 459) - ドラゴン / 特殊 / 威力150
- **プリズムレーザー** (Prism Laser, ID: 673) - エスパー / 特殊 / 威力160
- **メテオアサルト** (Meteor Assault, ID: 794) - かくとう / 物理 / 威力150
- **エターナルビーム** (Eternabeam, ID: 795) - ドラゴン / 特殊 / 威力160

※技ID（`RECHARGE_MOVE_IDS`）および技名（日本語・英語）で安全に判定可能なヘルパー関数 `isRechargeMove` を `src/utils/calculator.ts` に設ける。

---

## 3. UI設計・配置

### (1) チェックボックスの配置
- `StatSearch.tsx` の「メガポケモンを除く」チェックボックスの隣（`flex flex-wrap items-center gap-6`）に配置。
- 共通コンポーネント `Checkbox` を使用。
- 火力ランキング（`searchTarget === 'damage'`）時のみ操作可能とする（耐久ランキング時は `disabled` または非活性化）。

### (2) 多言語対応 (i18n)
キー名: `excludeRechargeMoves`
- `ja`: `"反動技を除く"`
- `en`: `"Exclude Recharge Moves"`
- `ko`: `"반동 기술(충전기) 제외"`
- `zh-Hant`: `"排除硬直招式 (反作用招式)"`
- `zh-Hans`: `"排除硬直招式 (反作用招式)"`

---

## 4. ロジック変更点

### (1) `src/utils/calculator.ts`
- `MaxDamageMoveInfo` インターフェースに `moveId?: number;` を追加。
- `calculateMaxDamage` の戻り値オブジェクトに `moveId: m.id` を付与。
- 反動技判定定数・関数を追加：
  ```ts
  export const RECHARGE_MOVE_IDS = new Set<number>([
    63, 307, 308, 338, 416, 439, 459, 673, 794, 795,
  ]);

  export function isRechargeMove(move: {
    moveId?: number;
    id?: number;
    moveName?: LocalizedName;
    name?: LocalizedName;
  }): boolean {
    const id = move.moveId ?? move.id;
    if (id && RECHARGE_MOVE_IDS.has(id)) return true;
    const jaName = move.moveName?.ja ?? move.name?.ja;
    if (jaName && RECHARGE_MOVE_NAMES.has(jaName)) return true;
    const enName = move.moveName?.en ?? move.name?.en;
    if (enName && RECHARGE_MOVE_NAMES.has(enName)) return true;
    return false;
  }
  ```

### (2) `src/components/StatSearch/StatSearch.tsx`
- 状態変数 `excludeRechargeMoves`（boolean, 初期値: false）を追加。
- ランキングリストのフィルタリングパイプラインに、反動技除外フィルタを追加：
  ```ts
  .filter((item) => {
    if (!excludeRechargeMoves || searchTarget !== 'damage') return true;
    return !isRechargeMove({ moveId: item.moveId, moveName: item.moveName });
  })
  ```
- チェックボックスUIの設置：
  ```tsx
  <div className="col-span-1 sm:col-span-2 lg:col-span-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 mt-1 flex flex-wrap items-center gap-6">
    <Checkbox
      id="exclude-mega"
      label={t('excludeMega')}
      checked={excludeMega}
      onChange={(e) => setExcludeMega(e.target.checked)}
    />
    <Checkbox
      id="exclude-recharge-moves"
      label={t('excludeRechargeMoves')}
      checked={excludeRechargeMoves}
      disabled={searchTarget !== 'damage'}
      onChange={(e) => setExcludeRechargeMoves(e.target.checked)}
    />
  </div>
  ```

---

## 5. TDD (テスト駆動開発) 計画

### Step 1: 多言語キーの追加とパリティ検証
- `src/locales/{ja,en,ko,zh-Hant,zh-Hans}.json` に `excludeRechargeMoves` を追加。
- `src/locales/i18n.test.ts` を実行して検証。

### Step 2: 単体テストの作成 (Red)
- `src/utils/calculator.test.ts`:
  - `isRechargeMove` が、はかいこうせん・ギガインパクト・ハイドロカノン等の反動技に対して `true` を返し、その他の技（10まんボルト、じしん等）に対して `false` を返すテスト。
  - `calculateMaxDamage` の結果に `moveId` が付与されていることの検証。
- `src/components/StatSearch/StatSearch.test.tsx`:
  - 「反動技を除く」チェックボックスのレンダリング検証。
  - チェックをオンにした際に、はかいこうせんやギガインパクト等の技がランキングから除外されることの検証。

### Step 3: 実装 (Green)
- `calculator.ts` および `StatSearch.tsx` にロジックとUIを実装。
- テストがすべてパスすることを確認。

### Step 4: リファクタ・ビルド・デプロイ
- Biome によるコード整形とリント。
- `npm run build` でビルド成功を確認。
- Cloudflare Pages へのデプロイ（`npm run deploy`）。
