# 計画書: 修正要望受付用 GitHub Issues リンクの設置

## 1. 概要と背景
- **ユーザー要望**:
  - 修正要望事項を受け付けるために、GitHub の Issue ページへのリンクを作成する。
  - URL: `https://github.com/ArcCosine/poke-tool/issues`
- **目的**:
  - 利用者がツールの不具合報告や機能改善要望、対戦データ調整に関するフィードバックを迅速に開発者へ送信できる導線を提供する。
  - 全ページ共通レイアウト（`Layout.tsx`）のフッターに設置し、どの画面からでもワンタップ／ワンクリックでアクセス可能にする。
  - 外部リンクとしてのセキュリティ対策（`rel="noopener noreferrer"`, `target="_blank"`）を徹底する。
  - プロジェクト憲章（`AGENTS.md`）に則り、4言語＋簡体字（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）の完全な多言語対応（100% キー対称性）と TDD（テスト駆動開発）を遵守する。

---

## 2. システム設計と UI 仕様

### 2.1 設置場所
- **コンポーネント**: `src/components/common/Layout.tsx` のフッターリンク群
- **構成順序**:
  ```text
  プライバシーポリシー | 免責事項 | 利用規約 | Cookie設定 | ご意見・ご要望 (GitHub)
  ```
- **視認性とアクセシビリティ**:
  - GitHub アイコン（`i-lucide-github`）または外部リンク表示を付与し、外部サイトへ遷移することが一目で分かるデザイン。
  - ホバーおよびフォーカス時の視覚的フィードバックを提供し、ダークモード・ライトモード双方で十分なコントラスト比を維持。

### 2.2 リンクの属性仕様
- **URL**: `https://github.com/ArcCosine/poke-tool/issues`
- **ターゲット**: `target="_blank"`
- **セキュリティ属性**: `rel="noopener noreferrer"`（タブ乗っ取り・リファラー漏洩防止）

---

## 3. 多言語辞書定義 (`src/locales/*.json`)

全5言語においてキー対称性を維持し、`footer.feedback` キーを追加：

| 言語コード | キー | 表示文言 |
|---|---|---|
| `ja` | `footer.feedback` | "ご意見・ご要望 (GitHub)" |
| `en` | `footer.feedback` | "Feedback & Issues (GitHub)" |
| `ko` | `footer.feedback` | "피드백 및 버그 제보 (GitHub)" |
| `zh-Hant` | `footer.feedback` | "問題與建議回報 (GitHub)" |
| `zh-Hans` | `footer.feedback` | "问题与建议反馈 (GitHub)" |

---

## 4. TDD（テスト駆動開発）検証計画

1. **多言語テスト (`src/locales/i18n.test.ts`)**:
   - `footer.feedback` のキー対称性（全5言語）を検証。
2. **Layout 単体テスト (`src/components/common/Layout.test.tsx`)**:
   - フッターに GitHub Issues へのリンクが存在すること。
   - `href` が `https://github.com/ArcCosine/poke-tool/issues` であること。
   - `target="_blank"` および `rel="noopener noreferrer"` が指定されていること。
3. **全体テスト & ビルド検証**:
   - `npm test`（全48テストスイート）の完全合格。
   - `npm run build` による型チェックとバンドル成功。
   - Cloudflare Pages へのデプロイ確認。

---

## 5. 作業手順
1. 本計画書のユーザー提示と合意取得（完了）
2. 多言語辞書（全5言語）と `i18n.test.ts` の更新（Red → Green 完了）
3. `Layout.test.tsx` に GitHub Issues リンクのテスト追加（Red 完了）
4. `Layout.tsx` のフッターに GitHub Issues リンクを実装（Green 完了）
5. 全体テスト（`npm test`）& ビルド（`npm run build`）（完了）
6. コミット & Cloudflare Pages デプロイ & 完了報告

---

## 6. 実装結果・検証
- **多言語対応**: 全5言語（`ja`, `en`, `ko`, `zh-Hant`, `zh-Hans`）に `footer.feedback` を追加し、`i18n.test.ts` のキー対称性テスト合格。
- **コンポーネント実装**: `Layout.tsx` フッターの末尾に GitHub アイコン付きリンクを安全な属性（`target="_blank"`, `rel="noopener noreferrer"`）とともに実装。
- **テスト検証**: `Layout.test.tsx` を含む全48テストスイート（285テスト）すべて合格。
- **ビルド検証**: `npm run build` による PWA・OGP・型チェック・バンドルすべて成功。

