# 59_構築記事画像収集とWASM-OCR精度向上計画

本計画は、実際のポケモンチャンピオンズ構築記事からパーティ画像を自動収集するスクリプト（1記事あたり最大5枚、最大50記事、合計最大250枚）を作成し、それらの実データを用いてブラウザ側のオンデバイス WASM OCR（onnxruntime-web / pure-onnx-ocr）の文字認識精度を大幅に向上させるための設計・実装手順を定義します。

---

## 1. 全体設計とステップ

### ① 構築記事画像の自動収集スクリプトの作成
* **収集元**: 構築記事検索ページ（`https://champs.pokedb.tokyo/article/search?rule=0`）
* **スクリプトの作成**: [`scripts/download_party_images.ts`](file:///home/arccosine/poke-tool/scripts/download_party_images.ts) を作成し、`tsx` を用いて実行できるようにします。
* **収集フロー**:
  1. `https://champs.pokedb.tokyo/article/search?rule=0` から HTML を取得し、はてなブログ等の外部構築記事へのリンク（`href`）を抽出。
  2. 抽出した上位の記事ページに対し、順次 HTML をフェッチ。
  3. 各記事ページの `<img>` タグの中から、ポケモンパーティ画像（アスペクト比が 16:9 に近く、かつ一定以上のピクセルサイズを持つもの）をフィルタリング。
  4. 各記事ページから該当する画像を **1記事あたり上限 5 枚** ダウンロードし、全体で **最大50記事**（合計最大250枚）を収集して、プロジェクト内の [`src/test/fixtures/downloaded/`](file:///home/arccosine/poke-tool/src/test/fixtures/downloaded/) に保存。

### ② OCR精度の向上処理（アルゴリズム改善）
ブログへアップロードされた画像はリサイズや圧縮ノイズ（JPEGにじみ）が発生しており、文字の認識率が低下しやすい問題があります。これを解決するために、以下の 3 つのアプローチで精度を改善します。

1. **画像前処理の導入（二値化・コントラスト強調）**
   * クロップした画像（特に特性やもちものなどの小さな文字領域）に対して、コントラストを強調したり、しきい値ベースの簡易的な二値化前処理（Binarization）を JS 側で適用してから `imageToTensorRec` でテンソル化するようにします。
   * これにより、背景と文字の境界がくっきりし、ONNX 認識モデル（SVTR）の入力精度が上がります。
2. **文字境界ボックス（クロップ位置）の動的補正**
   * スマホの機種や解像度、16:9 表示の余白比率によって、固定比率での切り出し範囲が文字の上下左右にズレて文字が見切れることがあります。
   * クロップの周囲に数ピクセルのパディングを追加して見切れを防ぐとともに、DBNet がフルスキャンで検出したバウンディングボックスの座標情報を活用して、クロップ位置を文字がある場所に微調整（アライメント）します。
3. **マスタデータ JSON からの辞書構築とLevensthein距離マッチングの最適化**
   * 辞書候補リストとして、以下の 3 つのマスタ JSON ファイルから抽出された正確な名前（日本語、英語、および必要に応じて韓国語）を使用します。
     - [`src/data/pokemon_master.json`](file:///home/arccosine/poke-tool/src/data/pokemon_master.json)
     - [`src/data/items_master.json`](file:///home/arccosine/poke-tool/src/data/items_master.json)
     - [`src/data/moves_master.json`](file:///home/arccosine/poke-tool/src/data/moves_master.json)
   * Levenshtein マッチング時に濁点の有無を無視する正規化を適用。
   * ポケモンの覚える技リストやそのポケモンが持つ特性などの制約を活用し、全単語辞書から探すのではなく、対象ポケモンが持つ可能性のある候補リストへ厳密に絞り込むことで、誤認識を自動補正します。

---

## 2. 実装タスク

### タスク 1: 画像ダウンロードスクリプトの実装
* [`scripts/download_party_images.ts`](file:///home/arccosine/poke-tool/scripts/download_party_images.ts) を作成。
  * `fetch` API を使って Champs 構築記事検索ページから外部リンクを取得。
  * リンク先のブログ記事からはてなブログの画像 CDN URL（`cdn-ak.f.st-hatena.com` など）や、16:9 アスペクト比に近い画像をフィルタリングしてダウンロード。
  * 各記事あたり **上限 5 枚**、スキャン対象として画像がダウンロードできた記事数が **最大50記事**（合計最大250枚）でダウンロードを停止。
  * `src/test/fixtures/downloaded/` ディレクトリに保存。
* コマンド `npx tsx scripts/download_party_images.ts` で実行できるようにします。

### タスク 2: 画像前処理（二値化・コントラスト）の実装
* [`src/utils/ocr.ts`](file:///home/arccosine/poke-tool/src/utils/ocr.ts) 内の `imageToTensorRec` を拡張。
  * キャンバスから画像ピクセルデータを取得し、簡易的な適応的しきい値処理（二値化）またはコントラスト調整（文字色をより暗く、背景を明るく）を実行。
  * 調整後のクリアな文字画像を ONNX 推論セッションに引き渡します。

### タスク 3: クロップアライメントと辞書補正の強化
* [`src/utils/ocr.ts`](file:///home/arccosine/poke-tool/src/utils/ocr.ts) の `resolveSlotOcr` および [`src/components/ImageAnalyzer/ImageAnalyzer.tsx`](file:///home/arccosine/poke-tool/src/components/ImageAnalyzer/ImageAnalyzer.tsx) のマッチングロジックを拡張。
  * クロップ時の見切れ防止のため、パディングを `displayH * 0.005` など動的に追加。
  * 上記の 3 つのマスタ JSON ファイル（`pokemon_master.json`, `items_master.json`, `moves_master.json`）をロードして辞書ベースのマッチング候補を構築。
  * Levenshtein マッチング時に濁点・半濁点や大文字・小文字、特殊記号などを正規化してマッチング精度を向上。

### タスク 4: テストと検証
* 新たにダウンロードされた実画像数枚をテスト fixture として追加。
* `vitest` 上で、それらの画像に対する解析結果のアサーションテストを追加し、認識率が向上していることを検証。
