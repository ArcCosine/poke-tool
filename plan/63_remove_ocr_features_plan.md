# 計画書: OCR機能の完全削除プラン (63_remove_ocr_features_plan.md)

現在開発されているOCR（画像解析）に関連するすべての機能、画面、ロジック、学習データ、WASMプロジェクトを完全に削除し、プロジェクトを軽量化・クリーンアップするための削除プランです。

> [!NOTE]
> ユーザーの要望により、OCRテスト用のスクリーンショット画像群 (`src/test/fixtures/` 以下) は削除せず、プロジェクトルート直下に作成する `sample/` ディレクトリへ構造を維持したまま移動します。

---

## 1. 背景と目的
OCR（画像解析）機能は開発・メンテナンスコストおよびビルドサイズが大きいため、今までに開発されたOCR関連の機能をすべて破棄し、プロジェクトから完全に削除します。
これにより、不要なライブラリや大容量の学習データ、ONNXモデルが削除され、ビルド成果物およびリポジトリサイズが大幅に削減されます。

---

## 2. 削除・移動対象の洗い出し

OCR機能に関連するすべての画面・コード・アセット・設定ファイルを以下に分類して洗い出しました。

### ① 画面（UIコンポーネント）
*   **`src/components/ImageAnalyzer/`** (ディレクトリごと削除)
    *   `ImageAnalyzer.tsx` (画像分析画面UI)
    *   `ImageAnalyzer.test.tsx` (コンポーネントテスト)
*   **`src/App.tsx` 内の関連定義とUI** (修正)
    *   `ImageAnalyzer` コンポーネントのインポート
    *   `Tab` 型定義から `'imageAnalyzer'` を削除 (`'dashboard' | 'statSearch' | 'partySimulator'` に変更)
    *   `tabIcons` から `imageAnalyzer` を削除
    *   `DashboardContent` 内の画像分析タブへのナビゲーションカード（ボタン）を削除
    *   `MainLayout` 内の `activeTab === 'imageAnalyzer'` 時のレンダリングおよび、ボトムナビゲーション内の `imageAnalyzer` ボタンを削除

### ② ロジック・ユーティリティ・テスト
*   **`src/utils/ocr.ts`** (ファイル削除: ONNX / Tesseract.js を用いたOCR実行ロジック)
*   **`src/utils/ocr.test.ts`** (ファイル削除: OCRユーティリティのテスト)
*   **`src/utils/ocr_integration.test.js`** (ファイル削除: OCRの統合テスト)

### ③ 画像アセットの移動 (新規要望)
*   **`src/test/fixtures/`** (移動)
    *   ディレクトリ構造（`filterd/`, `missed/` 等）を維持したまま、プロジェクトルート直下に新設する **`sample/`** ディレクトリへ移動します。
    *   移動完了後、元の `src/test/fixtures/` は削除します。

### ④ WASM・Rustサブモジュール・外部エンジン
*   **`src/wasm-analysis/`** (ディレクトリごと削除: 画像前処理・OCR後処理用Rust/WASMプロジェクト)
*   **`src/pkg/`** (ディレクトリごと削除: `wasm-pack` が出力したWASMパッケージ)
*   **`pure-onnx-ocr/`** (ディレクトリごと削除: Rust用 PaddleOCR 実行エンジン)

### ⑤ モデル・学習データ・キャッシュデータ
*   **`public/models/`** (ディレクトリごと削除: ONNXモデルファイル)
    *   `det.onnx` (テキスト検出モデル)
    *   `rec.onnx` (日本語・英語テキスト認識モデル)
    *   `rec_ko.onnx` (韓国語テキスト認識モデル)
    *   `ppocrv5_dict.txt` (日本語辞書ファイル)
    *   `korean_dict.txt` (韓国語辞書ファイル)
*   **`tessdata/`** (ディレクトリごと削除: Tesseract.js用の学習データ)
    *   `eng.traineddata` / `jpn.traineddata` / `kor.traineddata`
*   **ルート直下のデータ** (ファイル削除)
    *   `eng.traineddata`
    *   `jpn.traineddata`
    *   `ocr_fixture_results.txt` (OCRテスト結果キャッシュ)

### ⑥ 設定ファイルおよび翻訳の修正
*   **`package.json`** (修正)
    *   `dependencies` から `onnxruntime-web`, `tesseract.js` を削除
    *   `devDependencies` から `wasm-pack`, `vite-plugin-wasm`, `vite-plugin-top-level-await` を削除
    *   `scripts` から `build-wasm` を削除し、`build` スクリプトの `npm run build-wasm && ` 部分を削除
*   **`vite.config.ts`** (修正)
    *   `vite-plugin-wasm` および `vite-plugin-top-level-await` のインポートとプラグイン適用 (`wasmPlugin()`, `topLevelAwaitPlugin()`) を削除
*   **`src/context/AppContext.tsx`** (修正)
    *   翻訳データ `uiTranslations` からOCRおよび画像分析に関わる文言キーを削除:
        *   `imageAnalyzer`, `imageAnalyzerDesc`, `uploadPrompt`, `analyze`, `importToParty`, `analysisResult`, `detectedPokemon`, `radarChartStats`, `importSuccess`, `analyzing`, `uploadInstruction`, `uploadPreview`
    *   `privacyPolicyText` (プライバシーポリシーテキスト) から画像解析に関する言及（ローカル処理項目 1番など）を削除
    *   `disclaimerText` (免責事項テキスト) から画像解析およびOCRに関する言及を削除

---

## 3. 削除・移動作業のステップ

以下の手順で安全に削除・移動と動作確認を進めます。

### Step 1: 画像フィクスチャの移動
1.  プロジェクトルート直下に `sample/` ディレクトリを作成。
2.  `src/test/fixtures/` 配下のすべてのディレクトリ・画像を `sample/` 以下に構造を維持して移動。
3.  `src/test/fixtures/` ディレクトリを削除。

### Step 2: 関連ファイル・ディレクトリの削除
上記「削除対象の洗い出し」に記載した不要なファイルおよびディレクトリを物理削除します。

### Step 3: 設定ファイル（package.json / vite.config.ts）の修正と依存パッケージの再インストール
`package.json` と `vite.config.ts` を修正し、`node_modules` から不要になったパッケージをアンインストールします。

```bash
# 依存関係のクリーンインストール
npm install
```

### Step 4: UIコード（App.tsx）および翻訳データ（AppContext.tsx）の修正
`App.tsx` から `ImageAnalyzer` のインポートとタブ定義を削除し、ダッシュボードやボトムナビのカードを3つに整理します。
`AppContext.tsx` から不要になった翻訳キーと法的ページの言及を修正します。

### Step 5: ビルド・テストによる動作確認
OCR以外の機能が正しく動作すること、テストスイートがパスすることを確認します。

```bash
# テストの実行
npm run lint
npm run test
# プロジェクトのビルド確認
npm run build
```

---

## 4. 期待される効果
*   **リポジトリ・アセットサイズの削減**: ONNXモデル（約34MB）やTesseract学習データ（約8.2MB）などの大容量ファイルを削除し、ディスク容量を大幅に削減します。
*   **ビルド・開発体験の向上**: RustのWASMビルド手順が不要になり、ビルドが高速化します。
*   **画像の再利用**: テスト用のスクリーンショット画像群は `sample/` ディレクトリに退避されるため、別プロジェクトへの移行が容易です。
