# 検索候補しぼりこみ入力（Autocomplete）の共通コンポーネント化計画

## 概要
HTML5 の `<datalist>` を使用したしぼりこみでは、入力された文字（ひらがな）と候補（カタカナ）をブラウザ自身が内部で再比較して非表示にしてしまうため、ふりがなを見せない状態でのひらがなしぼりこみがブラウザの仕様上実現できません。
この問題を完璧に解決するため、`<datalist>` に頼らず、ひらがなでしぼりこみ可能でかつひらがな表記を一切表示しない、React制御のカスタムドロップダウン付きオートコンプリートコンポーネント `Autocomplete` を作成し、`src/components/common/Autocomplete.tsx` に共通化します。

---

## 共通コンポーネントの設計

### `Autocomplete` (`src/components/common/Autocomplete.tsx`)
- **役割**: インクリメンタルサーチ付きのカスタム入力フィールド。
- **Props**:
  - `id?: string`
  - `label?: string`
  - `value: string`: 選択されている値。
  - `suggestions: string[]`: 検索候補の全リスト（例: 正式な持ち物名や技名の配列）。
  - `onChange: (val: string) => void`: 値が選択またはリセットされた時のコールバック。
  - `placeholder?: string`
  - `disabled?: boolean`
  - `className?: string`
- **しぼりこみロジック**:
  - ユーザーの入力中の文字列（ひらがな）をカタカナ（`normalizeSearchText`）およびひらがな（`katakanaToHiragana`）に変換します。
  - `suggestions` 内の各候補をひらがな化したものとも比較し、部分一致する候補のみをドロップダウンに表示します（ドロップダウンには正式名称のみを表示し、ひらがなは非表示にします）。
- **UXの考慮点**:
  - 入力フォーカス時に候補一覧を表示します。
  - 候補をクリックした際に即時確定し、ドロップダウンを閉じます。
  - フォーカスアウト（`onBlur`）時は、不正な文字列が残らないよう、現在選択されている正しい値に戻します（クリックイベントが先に伝播するよう `setTimeout` を使用します）。

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストコードの作成 (Red)
- `src/components/common/Autocomplete.test.tsx` を作成します。
- `Autocomplete` がまだ未実装である状態でテストを実行し、テストが失敗（Red）することを確認します。
- テスト内容:
  - 初期値が正しく表示されること
  - フォーカス時に入力候補ドロップダウンが表示されること
  - ひらがなで入力した際、対応するカタカナ候補にしぼりこまれること
  - 候補をクリックした際、`onChange` がその正式名で正しく呼び出されること

### ステップ 2: 実装の作成 (Green)
- `src/components/common/Autocomplete.tsx` を実装します。
- テストがすべてパス（Green）することを確認します。

### ステップ 3: 既存コードの置き換え
- `PartySimulator.tsx` の「持ち物」および「技」のしぼりこみ入力を、新規作成した `Autocomplete` に置き換えます。
- 置き換え後、すべてのテストを走らせて動作に影響がないことを確認します。

### ステップ 4: `AGENTS.md` の更新
- `AGENTS.md` の共通コンポーネント対象に `Autocomplete.tsx` を追記します。
