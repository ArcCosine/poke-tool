# 計画書: OCR機能・サンプル画像・収集ツールの完全削除プラン (67_remove_ocr_features_permanently_plan.md)

現在実装されているOCR（画像解析）機能、およびそれに関連するテスト用画像、画像収集ツール・分類スクリプト群をプロジェクトから完全に削除し、プロジェクトをクリーンアップ・軽量化するための計画書です。

---

## 1. 背景と目的
OCR（画像解析）機能は現実的ではなかったため破棄します。これに伴い、OCR実行エンジン、関連UI、`sample/` ディレクトリ内のテスト用スクリーンショット画像、および画像を収集・分類するために作成した各種ツール類・スクリプトをすべて完全に削除します。
これにより、不要な外部依存パッケージ（`onnxruntime-web`）を減らし、ディスク容量およびビルド構成を最適化します。

---

## 2. 削除・修正対象の洗い出し

### ① 削除対象のディレクトリ・ファイル

#### [UIコンポーネント]
*   `src/components/ImageAnalyzer/` (ディレクトリごと削除)
    *   `ImageAnalyzer.tsx` (画像分析画面UI)

#### [OCRロジック・Web Worker・テスト]
*   `src/utils/ocr.ts` (OCRラッパーロジック)
*   `src/utils/ocr.worker.ts` (Web Worker処理)
*   `src/utils/ocrFuzzy.ts` (ポケモンマスタデータとのファジーマッチングロジック)
*   `src/utils/ocrFuzzy.test.ts` (ファジーマッチングの単体テスト)

#### [サンプル画像]
*   `sample/` (ディレクトリごと削除)
    *   テスト用のスクリーンショット画像群（`filterd/`, `missed/` などすべてのサブディレクトリを含む）

#### [アセット・ダウンロードモデル]
*   `scripts/ocr_models/` (ディレクトリごと削除: OCR用のモデル・定義ファイル等の格納先)

#### [画像収集・分類・デバッグツール (scripts/)]
*   `scripts/classify_images.ts` (画像分類スクリプト)
*   `scripts/classification_results.json` (画像分類結果のキャッシュデータ)
*   `scripts/classifier_config.json` (画像分類の設定ファイル)
*   `scripts/optimize_classifier.ts` (分類器最適化スクリプト)
*   `scripts/download_party_images.ts` (サンプル画像収集ツール: PokeDBから画像を自動ダウンロード)
*   `scripts/debug_tesseract.ts` (Tesseract動作確認用デバッグツール)
*   `scripts/inspect-model.js` (モデル構造確認用ツール)
*   `scripts/run_fixture_ocr.ts` (OCR精度テスト用フィクスチャ実行スクリプト)
*   `scripts/copy-wasm.js` (WASMファイルのコピー用スクリプト)
*   `scripts/download-models.js` (OCRモデルダウンロードスクリプト)

---

### ② 修正対象ファイル

#### `src/App.tsx`
*   `ImageAnalyzer` コンポーネントのインポートを削除。
*   `Tab` 型定義から `'imageAnalyzer'` を削除 (`'dashboard' | 'statSearch' | 'partySimulator'` に変更)。
*   `tabIcons` から `imageAnalyzer` の設定を削除。
*   `DashboardContent` 内の画像分析ナビゲーションカード（ボタン）を削除し、グリッドのレイアウトを `grid-cols-1 md:grid-cols-3` から `grid-cols-1 md:grid-cols-2` に調整。
*   `MainLayout` 内の `activeTab === 'imageAnalyzer'` レンダリング部分を削除。
*   ボトムナビゲーション `nav` 内のループ対象配列から `'imageAnalyzer'` を削除。

#### `src/context/AppContext.tsx`
*   `uiTranslations`（`ja` / `en`）から、不要になった以下のOCR関連の翻訳キーを削除：
    *   `imageAnalyzer`
    *   `imageAnalyzerDesc`

#### `package.json`
*   `dependencies` から `"onnxruntime-web"` を削除。
*   `scripts` 内の `dev` と `build` から、WASMコピー用スクリプトの実行部分を削除：
    *   `dev`: `"node scripts/copy-wasm.js && vite"` → `"vite"`
    *   `build`: `"node scripts/copy-wasm.js && tsc -b && vite build"` → `"tsc -b && vite build"`

---

## 3. 削除・修正作業の手順

### Step 1: ファイルおよびディレクトリの物理削除
上述の「削除対象のディレクトリ・ファイル」にリストアップされたものを削除します。

### Step 2: ソースコードの修正
`src/App.tsx`、`src/context/AppContext.tsx` を修正し、OCR関連のUI、型定義、翻訳テキストを削除します。

### Step 3: 設定ファイルの修正と依存パッケージの更新
1.  `package.json` を修正し、`onnxruntime-web` の削除および起動/ビルドスクリプトから `copy-wasm.js` の実行を取り除きます。
2.  `node_modules` 内の不要な依存関係を整理するため、パッケージのインストールを実行します。
    ```bash
    npm install
    ```

### Step 4: 動作確認とビルド検証
OCR機能の削除後も、既存の機能（火力・耐久計算、パーティシミュレーター）が正常に動作し、ビルドやテストが正常にパスすることを確認します。

```bash
# リンターとフォーマッターの実行
npm run lint

# 単体テストの実行（OCR関連のテストが削除された状態で、他のテストが全てパスすることを確認）
npm run test

# 本番ビルドの実行
npm run build
```

---

## 4. 残すもの（OCRと無関係であることが確認されたもの）
*   `scripts/fetch_pokeapi.ts`: ポケモンのマスタデータをPokeAPIから取得するためのスクリプト。
*   `scripts/cache/`: `fetch_pokeapi.ts` が取得した一時的なPokeAPIデータキャッシュ。
*   `scripts/add_regulation.ts` / `scripts/regulations_config.json`: ポケモン対戦のレギュレーション設定スクリプト・設定ファイル。
