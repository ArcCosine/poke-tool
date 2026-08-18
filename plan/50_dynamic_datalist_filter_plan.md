# 技・持ち物の動的フィルタリングしぼりこみ（ひらがな非表示）対応計画

## 概要
HTML5 `<option>` の `label` 属性にひらがなを設定した場合でも、一部のブラウザ環境（Chromeなど）の仕様により、選択候補リスト（ドロップダウン）内にひらがな（サブテキストなど）が表示されてしまうことがあります。
この違和感を完全に解消するため、`<option>` には一切のひらがな（`label` やサフィックス）を含めず、正式名称のみを指定した上で、React（JavaScript）側で入力値に基づいて候補リスト自体を動的にフィルタリングして出力する仕組みへと改善します。

---

## 提案する実装アプローチ

### 1. React側での動的フィルタリング関数の定義
ユーザーが現在入力している文字列（ひらがな・カタカナ・アルファベット）に基づき、マッチする候補のみを配列で返すフィルタリング処理を `PartySimulator.tsx` 内に実装します。

- **`getFilteredItems(inputValue: string)`**:
  - `itemsData` から、入力値と「正式名（カタカナ）」「ひらがな（`katakanaToHiragana`での変換値）」が部分一致する持ち物のみを返します。
- **`getFilteredMoves(inputValue: string)`**:
  - `learnableMoves` から、入力値と「技名（カタカナ/ひらがな）」「タイプ名（カタカナ/ひらがな）」が部分一致する技のみを返します。

### 2. `<datalist>` の `<option>` からひらがな表示の完全撤廃
各 `<option>` 要素には `value="正式名"` のみを指定し、`label` 属性やふりがなサフィックスは一切付与しません。
- **持ち物**:
  ```tsx
  <datalist id={`item-list-${index}`}>
    {getFilteredItems(member.item || '').map((item) => {
      const name = language === 'ja' ? item.name.ja : item.name.en;
      return <option key={item.id} value={name} />;
    })}
  </datalist>
  ```
- **技**:
  ```tsx
  <datalist id={`move-list-${index}-${mIdx}`}>
    {getFilteredMoves(displayValue).map((m) => {
      const nameOnly = m.name[language];
      const typeName = typeTranslations[m.type]?.[language] || m.type;
      const displayName = `${nameOnly} (${typeName})`;
      return <option key={m.id} value={displayName} />;
    })}
  </datalist>
  ```

### 3. メリット
- `<option>` 要素には正式名称しか含まれないため、どのようなブラウザ環境であっても、ドロップダウン選択リストにはひらがなが一切表示されず、デザインの違和感が完全に解消されます。
- 入力値に基づいて React 側で瞬時に datalist の中身を更新するため、ひらがな入力でのしぼりこみ体験は変わらず高速に動作します。

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストコードの実行と確認
- `npx vitest run` を走らせて、既存のテストが正常に動作していることを確認します。

### ステップ 2: 実装の変更
- `PartySimulator.tsx` に `getFilteredItems` および `getFilteredMoves` 関数を定義します。
- 持ち物および技の `datalist` のループ部分で、これらのフィルタリングされた候補を使用するように書き換えます。
- 各 `<option>` から `label` 属性を削除します。
- 変更後、すべてのテストが Green で通過することを確認します。
