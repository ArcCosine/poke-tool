# 計画：パーティ編成画面でのポケモン名文字入力フィルタリング機能の追加

## 概要
パーティ編成画面において、ポケモンの選択をよりスムーズに行えるようにするため、文字入力による絞り込み機能を追加します。
既存のDropdown（セレクトボックス）はそのまま維持しつつ、各スロットに入力フィールドを設け、入力内容に応じてDropdownの選択肢が動的にフィルタリングされるようにします。

## 要件
1. **入力フィールドの追加**: 
   各ポケモンスロットの「ポケモン選択」Dropdownの上に、テキスト入力フィールド（検索窓）を設置します。
2. **動的フィルタリング**:
   - 入力フィールドに文字が入力されると、Dropdown内のポケモン選択肢（`<option>`）がその文字を含むものだけに絞り込まれます。
   - ひらがな・カタカナの表記揺れ（ひらがなで入力してもカタカナのポケモン名がヒットする）や、英語名/日本語名の両方での検索に対応し、使いやすさを高めます。
   - 入力フィールドが空の場合は、すべてのポケモンが選択肢に表示されます。
3. **Dropdown機能の維持**:
   標準の `<select>` 要素はそのまま残し、絞り込まれた状態から通常通り選択できるようにします。
4. **状態の独立性**:
   各ポケモンスロット（最大6個）はそれぞれ独立したフィルタ状態を持ち、パーティメンバーの追加や削除を行ってもフィルタ状態が崩れないようにします。
   （スロットのユニークID `member.id` をキーとしてフィルタ文字列を管理します）

## 設計

### UIレイアウト
各パーティメンバースロットの「ポケモン」選択箇所を以下のように構成します：

```html
<div class="flex flex-col gap-1">
  <label for="pokemon-filter-{id}">ポケモン #{index + 1}</label>
  <!-- フィルタ用入力欄 -->
  <input
    id="pokemon-filter-{id}"
    type="text"
    placeholder="名前で絞り込み (ひらがな・カタカナ可)"
    class="input-premium py-1.5 text-xs"
    value={filters[member.id] || ''}
    onChange={(e) => updateFilter(member.id, e.target.value)}
  />
  <!-- ポケモン選択Dropdown -->
  <select
    id="pokemon-select-{id}"
    value={member.masterId}
    onChange={...}
    class="input-premium py-2 text-sm cursor-pointer"
  >
    <option value={0}>-- ポケモンを選択 --</option>
    {filteredPokemonData.map((p) => (
      <option key={p.id} value={p.id}>{p.name[language]}</option>
    ))}
  </select>
</div>
```

### フィルタリングロジック
ひらがなをカタカナに変換して比較するヘルパー関数を実装し、ひらがなでの入力でもカタカナのポケモン名にヒットするようにします。

```typescript
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[\u3041-\u3096]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) + 0x60);
    });
};
```

## TDD (テスト駆動開発) のステップ
1. **テストケースの作成（Red）**:
   `src/components/PartySimulator/PartySimulator.test.tsx` を新規作成し、以下のテストを記述します：
   - フィルタ入力欄が存在することのテスト。
   - 入力欄に文字を入力した際に、Dropdown内の選択肢が正しくフィルタリングされることのテスト。
   - フィルタリングされたDropdownから項目を選択した際、正しくメンバーステートが更新されることのテスト。
2. **実装（Green）**:
   `PartySimulator.tsx` に入力フィールドとフィルタリング状態（`filters`）を追加し、フィルタリングロジックを組み込みます。
3. **リファクタリング（Refactor）**:
   コードを整理し、アクセシビリティ（WAI-ARIAラベルなど）やデザインのクリーンアップを行います。
