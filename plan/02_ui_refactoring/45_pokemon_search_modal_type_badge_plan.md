# PokemonSearchModal への TypeBadge 反映およびバリアント拡張計画

## 概要
[src/components/PartySimulator/PokemonSearchModal.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PokemonSearchModal.tsx) のタイプ表示箇所にも `TypeBadge` 共通コンポーネントを適用します。
モーダル内のタイプ表示はカラフルな背景を持つ塗りつぶしバッジ（`solid` スタイル）であるため、`TypeBadge` に `variant` プロパティを追加してこの表示スタイルを共通化します。

---

## 設計案

### 1. `TypeBadge` (`src/components/common/TypeBadge.tsx`) の拡張
- **新Props**:
  - `variant?: 'text' | 'solid'`: バッジのスタイル（デフォルトは `'text'`）。
    - `'text'`: 従来の背景なしテキスト表示。
    - `'solid'`: `typeColors` に基づくカラフルな背景と白文字のバッジ表示。
- **実装イメージ**:
  ```tsx
  import React from 'react';
  import { typeTranslations, typeColors } from '../../utils/pokemon';
  import { useApp } from '../../context/AppContext';

  interface TypeBadgeProps {
    typeKey: string;
    showText?: boolean;
    responsiveText?: boolean;
    variant?: 'text' | 'solid';
    className?: string;
    imgClassName?: string;
  }

  export const TypeBadge: React.FC<TypeBadgeProps> = ({
    typeKey,
    showText = true,
    responsiveText = false,
    variant = 'text',
    className = '',
    imgClassName = '',
  }) => {
    const { language } = useApp();
    const label = typeTranslations[typeKey]?.[language] || typeKey;

    let variantClass = 'text-slate-700 dark:text-slate-300';
    if (variant === 'solid') {
      const colorBg = typeColors[typeKey] || 'bg-slate-500 text-white';
      variantClass = `px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider ${colorBg}`;
    }

    const baseClass = `inline-flex items-center gap-1.5 text-xs font-semibold select-none ${variantClass} ${className}`.trim();
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
  ```

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストコードの作成 (Red)
- [src/components/common/TypeBadge.test.tsx](file:///home/arccosine/poke-tool/src/components/common/TypeBadge.test.tsx) に、`variant="solid"` の時に正しい背景色クラス（`bg-red-500` など）が付与されるかを検証するテストを追加します。
- テストを実行し、新機能のテストが失敗（Red）することを確認します。

### ステップ 2: 実装の修正 (Green)
- `TypeBadge.tsx` を修正して `variant` プロパティをサポートします。
- テストを実行し、すべて通過（Green）することを確認します。

### ステップ 3: モーダルの書き換えと動作確認
- `PokemonSearchModal.tsx` に `TypeBadge` をインポートし、対象箇所を以下のように置き換えます。
  ```tsx
  <TypeBadge
    key={typeKey}
    typeKey={typeKey}
    variant="solid"
    imgClassName="w-3 h-3"
  />
  ```
- 置き換え後、すべてのテストを走らせて動作に影響がないことを確認します。
