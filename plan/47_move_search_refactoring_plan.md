# 技選択への検索機能（しぼりこみ機能）導入計画

## 概要
[src/components/PartySimulator/PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) における「技の選択（Move Selection）」は、セレクトボックス（`Select`）で行われていますが、選択可能な技の数が非常に多く、目的の技を見つけるのが困難です。
これをテキスト入力によるしぼりこみが可能なインクリメンタルサーチ形式に変更します。

---

## 提案する実装アプローチ
データモデル側の仕様で、技の選択状態は「技のID（`number`）」として保存されています。
これとしぼりこみ入力を両立させるため、入力途中のテキストを一時的に保持する状態（`tempMoveTexts`）を導入し、HTML5標準の `<datalist>` と組み合わせます。

### 1. 一時テキスト状態の導入
- **変数**: `tempMoveTexts: Record<string, string>`（キーは `${memberIndex}-${moveIndex}` 形式）
- **役割**: ユーザーが技名テキストを入力している最中の文字列を一時保存し、インプットエリアの表示を Controlled に保ちます。

### 2. インプットコンポーネントへの置き換え
- 従来の `Select` から `Input` に置き換えます。
- `Input` には各技スロット専用の `datalist` を紐付けます。

### 3. イベントハンドラの設計
- **`onChange`**:
  - 入力された文字列を `tempMoveTexts` に即座に反映します（これにより入力がスムーズに行えます）。
  - 入力文字列が `learnableMoves` のいずれかの技名と完全一致した場合、その技の ID で親の `moves` 状態を更新（`updateMove`）します。
  - 空文字の場合は ID を `0` にリセットします。
- **`onBlur` (フォーカスアウト時)**:
  - `tempMoveTexts` から該当スロットの一時テキストを削除し、本来設定されている技名表示に戻します（不正な入力の混入を防ぐため）。

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストの実行と確認
- 現在、`PartySimulator.test.tsx` で技の変更などをテストしている箇所があるか確認します。
- `npx vitest run` を走らせて、既存のテストが正常に動作していることを確認します。

### ステップ 2: 実装の置き換え
- `PartySimulator.tsx` に `tempMoveTexts` の状態を追加します。
- 技の `Select` コンポーネントを `Input` と `datalist` の組み合わせに置き換え、イベントハンドラ（`onChange` および `onBlur`）を実装します。
- 実装後、すべてのテストを走らせて正常に動作することを確認します（Green）。
