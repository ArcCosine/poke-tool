# 58_ImageAnalyzerとWASM-OCR連携およびローカルJSON化実装計画

本計画は、`ImageAnalyzer.tsx` コンポーネントとオンデバイス WASM OCR（onnxruntime-web / pure-onnx-ocr）を連携させ、外部API（Gemini API）を使用せずに、ブラウザ単体でスクリーンショットから高精度に情報を抽出し、構造化されたJSONデータを生成・エクスポートする仕組みの構築手順を定義します。

---

## 1. 設計方針

### ① 現状の課題
* 現在の `ImageAnalyzer.tsx` は `ocr.runFullImageOcr(canvas)` を呼び出していますが、言語（`lang`）が指定されておらず、韓国語画像などの他言語スクリーンショットに対して日本語/英語用の認識モデルで推論してしまい、文字化けや認識漏れが発生します。
* また、各スロット領域からピンポイントでテキストを読み取る `ocr.resolveSlotOcr` がダミー実装（常に null を返却）のままになっています。
* 解析されたデータはlocalStorageへの保存やポケソル形式テキストでのコピーはできますが、機械可読な構造化JSONとしてエクスポートする機能がありません。

### ② 解決策・設計案
1. **言語の自動判定・連携**
   * CLI版の自動判定ロジックと同様に、日本語/英語（`recSession`）と韓国語（`recKoSession`）の両方で並行（または段階的）にOCR試行を行い、平均信頼度の高い方のモデル結果を採用する「言語自動判定機能」をフロントエンドに実装します。
   * これにより、ユーザーが言語を手動選択しなくても、日本語・英語・韓国語のスクリーンショットを自動で正しく認識可能にします。
2. **ピンポイント Crop OCR（`resolveSlotOcr`）の実装**
   * [`src/utils/ocr.ts`](file:///home/arccosine/poke-tool/src/utils/ocr.ts) 内でダミーとなっている `resolveSlotOcr` を実装します。
   * 指定された `slotIdx` と `field`（ポケモン名、特性、アイテム）のバウンディングボックス座標から画像を切り出し、ONNX OCRセッションに流してピンポイントで文字認識を行います。画像全体のスキャンから漏れた文字情報を確実に補完します。
3. **ローカルJSONエクスポート機能の追加**
   * 解析成功時に表示される結果領域に、新しく「JSON形式でコピー」ボタンを追加します。
   * ボタン押下時、解析されたパーティー情報（ポケモン名、特性、もちもの、技、努力値EVs）をクリーンなJSON文字列にシリアライズし、クリップボードにコピーします。

---

## 2. 実装タスク

### タスク 1: ピンポイント Crop OCR（`resolveSlotOcr`）の実装
* [`src/utils/ocr.ts`](file:///home/arccosine/poke-tool/src/utils/ocr.ts) の `resolveSlotOcr` を実装。
  * `canvas` から該当スロット（0〜5）の項目（`name` / `ability` / `item`）に対応する相対座標・サイズを計算してクロップ。
  * クロップした画像に対して `recSession` または `recKoSession`（判定された言語に応じて）を用いて推論を実行し、認識テキストを取得。
  * `candidates` リストとの Levenshtein 距離（`findBestMatch`）を適用し、補正された文字列を返却。

### タスク 2: `ImageAnalyzer.tsx` 側での言語判定・連携の統合
* [`src/components/ImageAnalyzer/ImageAnalyzer.tsx`](file:///home/arccosine/poke-tool/src/components/ImageAnalyzer/ImageAnalyzer.tsx) 内の `startAnalysis` を修正。
  * CLIと同様に、各画像に対して日本語/英語エンジンと韓国語エンジンのOCR信頼度を比較する言語判定パスを追加。
  * 判定された言語を用いて `ocr.runFullImageOcr(canvas, detectedLang)` および `ocr.resolveSlotOcr` を実行。

### タスク 3: JSONエクスポートUIの実装
* `ImageAnalyzer.tsx` の解析結果画面（インポートボタンやポケソルコピーボタンの並び）に、「JSON形式でコピー」ボタンを設置。
* コピーされるJSONは、以下のようにユーザーや外部ツールが理解しやすいクリーンな構造とします。
  ```json
  [
    {
      "pokemon_name": "ゲッコウガ",
      "ability_name": "へんげんじざい",
      "held_item": "きあいのタスキ",
      "moves": ["みずしゅりけん", "あくのはどう", "れいとうビーム", "ヘドロウェーブ"],
      "evs": { "hp": 0, "attack": 0, "defense": 4, "sp_attack": 252, "sp_defense": 0, "speed": 252 }
    }
  ]
  ```

### タスク 4: テスト（TDD）の更新と動作検証
* [`src/components/ImageAnalyzer/ImageAnalyzer.test.tsx`](file:///home/arccosine/poke-tool/src/components/ImageAnalyzer/ImageAnalyzer.test.tsx) に「JSON形式でコピー」ボタンのクリックと、正しいJSONデータがクリップボードに書き込まれることを確認するテストケースを追加。
* `npm run test` がすべて正常にパスすることを確認。
