# 110_party_simulator_remove_button_wrapper_div_plan.md

## 目的
パーティ編成画面（`src/components/PartySimulator/PartySimulator.tsx`）のポケモンスロットカードにおいて、削除ボタン（Button）を専用のラッパー `div` で囲み、その `div` によってマージンやパディングなどのレイアウト領域を調整する構造へリファクタリングする。これにより、削除ボタンの右上配置を維持しながら、ポケモン名との重なりを構造的に防止する。

## 現状と課題
- **現状**:
  - 削除ボタン（`<Button ... />`）が `absolute top-4 right-4` で親カードに直接浮遊配置されていた。
  - 先ほどの対応ではポケモン選択行に `pr-24 sm:pr-28` を設定したが、固定パディングによる回避ではなく、削除ボタン自体を `div` で囲んでレイアウトと余白を管理する構造が求められている。
- **改善点**:
  - 削除ボタンを専用のラッパー `div`（例: `<div className="...">...</div>`）で囲む。
  - ポケモン選択エリア（アイコン・タイプ・名前）と削除ボタンラッパー `div` を共通のフレックスコンテナ（`flex items-center justify-between gap-3` 等）に収めるか、あるいは右上配置用のラッパー `div` で適切なマージン・パディングを管理する。
  - 自然なフレックス配置（左側: アイコン・タイプ・名前トリガー `flex-1 min-w-0`、右側: 削除ボタンラッパー `div` `shrink-0`）とすることで、固定値パディングに依存せず、画面サイズが縮小しても削除ボタンの領域が確実に保護され、ポケモン名の上に被ることが一切なくなる。

## 改修方針

### 1. JSX構造の再設計
```tsx
{/* 上部ヘッダー: ポケモン情報（アイコン/タイプ/名前） + 削除ボタン */}
<div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
    {/* ポケモンアイコン & タイプバッジ */}
    <div className="flex items-center gap-3 shrink-0">
      {/* アイコン */}
      ...
      {/* タイプバッジ */}
      ...
    </div>

    {/* ポケモン選択トリガー（名前ボタン） */}
    <div className="flex-1 min-w-0">
      <button ...>
        ...
      </button>
    </div>
  </div>

  {/* 削除ボタンを囲むラッパーdiv（右上の領域を確保） */}
  <div className="shrink-0">
    <Button
      onClick={() => removePokemonFromParty(index)}
      variant="danger"
      icon="i-lucide-trash-2"
      className="cursor-pointer"
    >
      {t('remove')}
    </Button>
  </div>
</div>
```

### 2. メリット
- 削除ボタンが専用の `div` でラップされ、その `div` の境界・サイズ（`shrink-0`）によりレイアウト領域が明示的に確保される。
- `absolute` による重なり問題が根本的に解消される。
- 画面サイズがどれだけ狭くなっても、左側のポケモン名トリガーが flex-1 で縮小・`truncate` され、右上の削除ボタン領域を侵害しない。

### 3. TDD (テスト駆動開発)
- `src/components/PartySimulator/PartySimulator.test.tsx` にて、削除ボタンがラッパー `div` で囲まれており、そのラッパー `div` がヘッダーコンテナ内に正しく配置されていることを検証するテストを追加（Red）。
- `PartySimulator.tsx` を修正してテストをパスさせる（Green）。
- 全体テスト（`npm test`）でリグレッションがないことを確認。

## 開発ロードマップ
1. **計画書の作成・合意** (本ドキュメント)
2. **Red**: `PartySimulator.test.tsx` に削除ボタンラッパーdivの検証テストを追加
3. **Green**: `PartySimulator.tsx` を改修し、削除ボタンをdivで囲んでレイアウトを整理
4. **Refactor & 全体検証**: 全テスト実行・Biomeチェック・ビルド確認
