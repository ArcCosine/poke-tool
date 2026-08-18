# タイプ表示部分の共通コンポーネント化計画

## 概要
`PartySimulator` や `StatSearch` 内で定義されているポケモンのタイプ表示部分（画像および翻訳されたタイプ名テキスト）を、共通コンポーネント `TypeBadge` として抽象化し、`src/components/common/TypeBadge.tsx` に切り出します。

---

## 共通コンポーネントの設計案

### `TypeBadge` (`src/components/common/TypeBadge.tsx`)
- **役割**: タイプアイコンとテキストを表示するバッジコンポーネント。
- **Props**:
  - `typeKey: string`: ポケモンのタイプ（例: `'fire'`, `'water'`）。
  - `showText?: boolean`: テキスト（翻訳名）を表示するか（デフォルト: `true`）。
  - `responsiveText?: boolean`: モバイル等の狭い画面でテキストを隠すか（`hidden sm:inline`）（デフォルト: `false`）。
  - `className?: string`: ラッパーの `<span>` に適用する追加スタイルクラス。
  - `imgClassName?: string`: `<img>` に適用する追加スタイルクラス。

- **実装イメージ**:
  ```tsx
  import React from 'react';
  import { typeTranslations } from '../../utils/pokemon';
  import { useApp } from '../../context/AppContext';

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

    const baseClass = `inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none ${className}`.trim();
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
- `src/components/common/TypeBadge.test.tsx` を作成。
- `TypeBadge` コンポーネントがまだ作成されていない、または空である状態でテストを実行し、テストが失敗（Red）することを確認します。
- テスト内容:
  - アイコン画像が正しく表示されること
  - デフォルトでタイプ翻訳テキストが表示されること
  - `showText={false}` の場合にテキストが表示されないこと
  - `responsiveText` 指定時にテキスト要素に `hidden sm:inline` クラスが付与されること

### ステップ 2: 実装の作成 (Green)
- `src/components/common/TypeBadge.tsx` を実装。
- 新しく作成したテストがすべてパス（Green）することを確認します。

### ステップ 3: 既存コードの置き換え & 動作確認
- 以下のファイル内のタイプ表示マークアップを `TypeBadge` に置き換えます。
  - [src/components/PartySimulator/PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx)
  - [src/components/StatSearch/StatSearch.tsx](file:///home/arccosine/poke-tool/src/components/StatSearch/StatSearch.tsx)
- 置き換え後、すべてのテストを実行して動作に問題がないことを確認します。

### ステップ 4: `AGENTS.md` の更新
- `AGENTS.md` の共通コンポーネントセクションに対象として `TypeBadge.tsx` を追記します。
