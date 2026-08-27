# 共通コンポーネントの抽出および設計リファクタリング計画

## 概要
`PartySimulator` や `StatSearch` などのコンポーネントで使われている素のHTML要素（`<button>`、`<select>`、`<input type="text">`、`<input type="checkbox">`）を抽象化し、`src/components/common` に共通コンポーネントとして切り出します。これにより、コードの重複と肥大化を防ぎ、UIの一貫性を維持しやすい設計へとリファクタリングします。
また、この設計方針を今後の開発でも遵守できるよう、`AGENTS.md` に追記します。

---

## 共通コンポーネントの設計案

### 1. `Button` (`src/components/common/Button.tsx`)
- **役割**: 各種ボタンスタイルの共通化。
- **Props**:
  - `variant?: 'primary' | 'secondary' | 'dashed' | 'danger' | 'ghost'`: スタイルのバリエーション。
  - `icon?: string`: アイコンクラス（UnoCSSで使われている `i-lucide-xxx` など）を渡すと、テキストの左側にアイコンを表示する。
  - 標準の `React.ButtonHTMLAttributes<HTMLButtonElement>` の全 props を継承。
- **実装イメージ**:
  ```tsx
  import React from 'react';

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
    const baseStyle = 'transition duration-200 cursor-pointer font-semibold flex items-center justify-center gap-2';
    
    let variantStyle = '';
    switch (variant) {
      case 'primary':
        variantStyle = 'btn-primary';
        break;
      case 'secondary':
        variantStyle = 'btn-secondary';
        break;
      case 'dashed':
        variantStyle = 'w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-600 rounded-2xl text-slate-500 hover:text-indigo-500';
        break;
      case 'danger':
        variantStyle = 'p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 text-xs';
        break;
      case 'ghost':
        variantStyle = 'appearance-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 focus-visible:outline-none select-none text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ml-auto inline-flex items-center gap-1 cursor-default';
        break;
    }

    return (
      <button
        type="button"
        className={`${baseStyle} ${variantStyle} ${className}`}
        {...props}
      >
        {icon && <span className={icon} />}
        {children}
      </button>
    );
  };
  ```

### 2. `Select` (`src/components/common/Select.tsx`)
- **役割**: 特性、性格、持ち物、技などの選択ドロップダウンの共通化。
- **Props**:
  - `label?: string`: ラベルを表示したい場合に指定。
  - 標準の `React.SelectHTMLAttributes<HTMLSelectElement>` の全 props を継承。
- **実装イメージ**:
  ```tsx
  import React from 'react';

  interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
  }

  export const Select: React.FC<SelectProps> = ({
    label,
    id,
    className = '',
    children,
    ...props
  }) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-500 mb-1"
          >
            {label}
          </label>
        )}
        <select
          id={id}
          className={`input-premium py-2 text-sm cursor-pointer w-full box-border ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  };
  ```

### 3. `Input` (`src/components/common/Input.tsx`)
- **役割**: パーティ名入力などのテキストインプットの共通化。
- **Props**:
  - `label?: string`: ラベルを表示したい場合に指定。
  - 標準の `React.InputHTMLAttributes<HTMLInputElement>` の全 props を継承。
- **実装イメージ**:
  ```tsx
  import React from 'react';

  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
  }

  export const Input: React.FC<InputProps> = ({
    label,
    id,
    className = '',
    ...props
  }) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-500 mb-1"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          className={`input-premium py-2 text-sm font-semibold ${className}`}
          {...props}
        />
      </div>
    );
  };
  ```

### 4. `Checkbox` (`src/components/common/Checkbox.tsx`)
- **役割**: メガシンカ除外などのチェックボックスの共通化。
- **Props**:
  - `label: string`: チェックボックス横のテキストラベル。
  - 標準の `React.InputHTMLAttributes<HTMLInputElement>` の全 props を継承。
- **実装イメージ**:
  ```tsx
  import React from 'react';

  interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
  }

  export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    id,
    className = '',
    ...props
  }) => {
    return (
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <input
          id={id}
          type="checkbox"
          className={`w-4 h-4 text-indigo-650 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer ${className}`}
          {...props}
        />
        <label
          htmlFor={id}
          className="text-sm font-semibold select-none cursor-pointer"
        >
          {label}
        </label>
      </div>
    );
  };
  ```

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: 新規共通コンポーネントのテストコードの作成 (Red)
- `src/components/common` ディレクトリに以下のテストファイルを作成します。
  - `Button.test.tsx`
  - `Select.test.tsx`
  - `Input.test.tsx`
  - `Checkbox.test.tsx`
- コンポーネントがまだ作成されていない、または空である状態でテストを実行し、テストが失敗することを確認（Red）します。

### ステップ 2: 共通コンポーネントの実装 (Green)
- 各共通コンポーネントの実装ファイルを作成します。
- 新しく作成した共通コンポーネントのテストがすべて通過することを確認（Green）します。

### ステップ 3: 既存コンポーネントの置き換え & 動作確認
- `PartySimulator.tsx` および `StatSearch.tsx` の内部コードから、対象の素のHTMLタグを `Button`, `Select`, `Input`, `Checkbox` に置き換えます。
- 置き換えにあたって、余計なレイアウト崩れが発生しないように UnoCSS / CSS クラスの継承（`className` のマージ）を適切に行います。
- 置き換え後、既存のテスト（`PartySimulator.test.tsx`, `StatSearch.test.tsx`）を実行し、動作に問題がないことを確認します。

### ステップ 4: `AGENTS.md` の更新
- `AGENTS.md` に、UI部品の抽象化と `src/components/common` の共通コンポーネントを使用すべき旨の設計方針を追記します。
