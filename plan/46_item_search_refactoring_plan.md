# 持ち物選択への検索機能（しぼりこみ機能）導入計画

## 概要
現在、[src/components/PartySimulator/PartySimulator.tsx](file:///home/arccosine/poke-tool/src/components/PartySimulator/PartySimulator.tsx) における「持ち物（Held Item）」の選択には通常の `Select` コンポーネントが使われていますが、アイテム数が非常に多いため目的のアイテムを見つけるのが困難です。
これをテキスト入力によるしぼりこみが可能なインクリメンタルサーチ形式に変更します。

---

## 提案する実装アプローチ
HTML5 標準の `<datalist>` 属性を `Input` 共通コンポーネントと組み合わせて実装します。

- **理由**: 
  - 共通 `Input` コンポーネントは `React.InputHTMLAttributes<HTMLInputElement>` を継承しているため、`list` 属性などを追加修正なしでそのまま透過的にサポートできます。
  - 標準の `<datalist>` を使用することで、スマートフォンやPCのOS/ブラウザの標準UIを活用した、はみ出しやバグの起きないしぼりこみ付きオートコンプリートが実現できます。
  - メガシンカ用メガストーンの固定時などの `disabled` 状態とも綺麗に調和します。

### 変更イメージ:
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
  onChange={(e) =>
    updateMember(index, { item: e.target.value })
  }
  placeholder={language === 'ja' ? '持ち物を入力・検索...' : 'Search held item...'}
  className="py-2 text-sm w-full box-border disabled:opacity-60 disabled:cursor-not-allowed"
/>
<datalist id={`item-list-${index}`}>
  {itemsData.map((item) => {
    const name = language === 'ja' ? item.name.ja : item.name.en;
    return <option key={item.id} value={name} />;
  })}
</datalist>
```

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: テストコードの確認と動作検証
- `PartySimulator.test.tsx` で持ち物選択をシミュレートしている箇所があるか確認します。
- `Select` から `Input` に変わることで、テストでの `Select` 要素取得（例: `label` による取得や `select` イベント）が動作しなくなる場合があるため、テストコードを適宜 `Input`（テキスト入力）の形式に修正し、事前にテストが失敗（Red）することを確認します。

### ステップ 2: 実装の置き換え (Green)
- `PartySimulator.tsx` の持ち物選択部分を `Select` から `Input` + `datalist` へ置き換えます。
- 置き換え後、すべてのテストを実行してパス（Green）することを確認します。
