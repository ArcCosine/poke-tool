# 利用規約の禁止事項更新・整理計画 (Plan 62)

## 概要
ユーザーの要望に基づき、利用規約の「禁止事項」に以下の2点を追加し、さらに重複していたスクレイピング・負荷関連の条項を集約して整理します。

1. **競合サービス関係者によるアクセス・データ取得の禁止**
2. **大量データ取得（一括ダウンロード、スクレイピング等）目的のアクセスの禁止および過度な負荷をかけるアクセスの禁止（重複箇所の集約）**

多言語対応（日本語・英語）のため、双方の言語用テキストを更新します。

---

## 提案する実装アプローチ

### 1. 翻訳定義の更新
`src/context/AppContext.tsx` 内にある `termsOfServiceText` の日本語版と英語版の両方を更新します。

#### 日本語版の整理案（全5項目）
【第2条（利用条件と禁止事項）】の項目を以下のように集約します。
- 1. 本ツールのソースコード、アルゴリズムの改ざん、または不正なリバースエンジニアリング行為
- 2. 商用目的での本ツールの再配布、販売、または類似サービスの構築
- 3. スクレイピング、クローラー、ボット等の自動化ツールを用いた、本ツールや外部API、提供インフラに対する大量のデータ取得、一括ダウンロード、または過度な負荷をかけるアクセス行為（※旧3と旧5を集約）
- 4. 競合サービス関係者による本ツールの利用、データ収集、またはこれらを目的としたアクセス行為
- 5. その他、開発者または開発元の第三者に不利益や損害を与える行為、または公序良俗に反する行為（※旧6）

#### 英語版の整理案（全5項目）
[Article 2 - Permitted Use & Prohibitions] の項目を以下のように集約します。
- 1. Modifying, tampering with, or reverse-engineering the Tool's source code or underlying algorithms.
- 2. Redistributing, selling, or utilizing the Tool or its compiled components for commercial purposes.
- 3. Performing data scraping, or using crawlers, bots, or other automated tools to extract bulk data, perform bulk downloads, or send requests that cause excessive load on the Tool, its components, or external APIs.
- 4. Access, data collection, or use of the Tool by associates, operators, or developers of competing services.
- 5. Any other activity that causes damage to the developer or third parties, or violates public order.

---

## 開発ロードマップ (TDDの遵守)

### ステップ 1: 翻訳ファイルの修正
- `src/context/AppContext.tsx` を編集し、集約した禁止事項テキストに書き換えます。

### ステップ 2: 動作検証とテスト
- テストコードに影響がないことを確認するために `npx vitest run` を実行します。
- アプリケーションを起動し、UI上で規約のテキストが正しく整理されていることを確認します。
