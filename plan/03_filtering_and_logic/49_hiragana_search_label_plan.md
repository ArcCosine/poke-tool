# 技・持ち物のひらがなしぼりこみ検索（ラベル化）対応計画

## 概要
しぼりこみ候補に `[ひらがな]` が直接表示されてしまう違和感を解消するため、候補文字列自体にふりがなを埋め込むのではなく、HTML5 `<option>` の `label` 属性にふりがなを設定します。

---

## 提案する実装アプローチ
HTML5の `<option>` 要素は `value` 属性に加えて `label` 属性をサポートしており、主要なWebブラウザは `label` 属性に入力された文字列に対しても部分一致フィルタリング（しぼりこみ）を行います。

- **利点**:
  - ユーザーに表示されるのは `value` 属性の値（正式名称）のみになり、ひらがな（`label` 属性の値）は見えなくなります。
  - 選択時に入力エリアに入る値も `value` 属性の値（正式名称）そのものになるため、React側での `[ふりがな]` 部分の正規表現によるパース処理（クリーンアップ）が一切不要になり、コードがシンプルに保たれます。

### 変更イメージ（持ち物）:
```tsx
<Input
  id={`item-select-${index}`}
  list={`item-list-${index}`}
  label={language === 'ja' ? '持ち物' : 'Held Item'}
  value={member.item || ''}
  disabled={
    currentPoke.name.ja.startsWith('メガ') &&
    currentPoke.name.ja !== 'メガレックウザ'
  }
  onChange={(e) => updateMember(index, { item: e.target.value })}
  placeholder={language === 'ja' ? '持ち物を検索・入力...' : 'Search held item...'}
  className="py-2 text-sm w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
/>
<datalist id={`item-list-${index}`}>
  {itemsData.map((item) => {
    const name = language === 'ja' ? item.name.ja : item.name.en;
    const label = language === 'ja' ? katakanaToHiragana(name) : undefined;
    return <option key={item.id} value={name} label={label} />;
  })}
</datalist>
```

### 変更イメージ（技）:
```tsx
<datalist id={`move-list-${index}-${mIdx}`}>
  {learnableMoves.map((m) => {
    const nameOnly = m.name[language];
    const typeName = typeTranslations[m.type]?.[language] || m.type;
    const displayName = `${nameOnly} (${typeName})`;
    const label = language === 'ja' ? `${katakanaToHiragana(nameOnly)} ${katakanaToHiragana(typeName)}` : undefined;
    return <option key={m.id} value={displayName} label={label} />;
  })}
</datalist>
```

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストコードの実行と確認
- `npx vitest run` を走らせて、前回のテストが正常に動作していることを確認します。

### ステップ 2: 実装の変更
- `PartySimulator.tsx` の持ち物および技の `onChange` イベントハンドラから、ふりがなクリーンアップ処理（正規表現）を取り除き、直接 `e.target.value` を保存するシンプルな実装に戻します。
- `datalist` の `<option>` に対し、`value` からふりがなサフィックスを削除し、代わりに `label={label}` の形式でひらがなを設定します。
- 変更後、すべてのテストが Green で通過することを確認します。
