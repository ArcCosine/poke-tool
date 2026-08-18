# 57_pure-onnx-ocrを用いた多言語OCR(CLI)と言語モデルによるステータス抽出計画

本計画は、`pure-onnx-ocr`とPP-OCRv5_Mobile-ONNXモデルをNative Rust環境で動作するCLIとして実装し、言語モデル(Gemini API)と連携して日本語・英語・韓国語のスクリーンショットから能力・ステータス情報を構造化JSONで抽出する仕組みの構築、および不要となったPython環境の削除手順を定義します。

---

## 1. 破棄・削除対象

### ① 古いOCR設計プラン
* [10_ocr_design_plan.md](file:///home/arccosine/poke-tool/plan/10_ocr_design_plan.md)
* [11_ocr_and_stats_redesign_plan.md](file:///home/arccosine/poke-tool/plan/11_ocr_and_stats_redesign_plan.md)
* [12_layout_independent_ocr_plan.md](file:///home/arccosine/poke-tool/plan/12_layout_independent_ocr_plan.md)
* [13_run_onnx_test_plan.md](file:///home/arccosine/poke-tool/plan/13_run_onnx_test_plan.md)
* [14_python_onnx_ocr_test_plan.md](file:///home/arccosine/poke-tool/plan/14_python_onnx_ocr_test_plan.md)
* [15_rust_onnx_ocr_port_plan.md](file:///home/arccosine/poke-tool/plan/15_rust_onnx_ocr_port_plan.md)

### ② Python環境および関連スクリプト
* [.venv/](file:///home/arccosine/poke-tool/.venv) (仮想環境ディレクトリ)
* [scripts/onnx_test.py](file:///home/arccosine/poke-tool/scripts/onnx_test.py)
* [scripts/run_onnx_ocr.py](file:///home/arccosine/poke-tool/scripts/run_onnx_ocr.py)

---

## 2. 実装タスク

### フェーズ1: 不要ファイル・ディレクトリの削除
* 旧OCR計画ファイルおよびPython環境（`.venv`とスクリプト）を安全に削除する。

### フェーズ2: Rust OCR CLIの開発環境整備
* [src/wasm-analysis/Cargo.toml](file:///home/arccosine/poke-tool/src/wasm-analysis/Cargo.toml) に以下の依存関係を追加。
  * `pure-onnx-ocr = "0.1.0"`
  * `tokio` (CLI非同期実行用)
  * `reqwest` (Gemini API 呼び出し用)
  * `serde`, `serde_json`
  * `clap` (コマンドライン引数の解析用)
* CLI用バイナリターゲットを追加（例: `src/bin/poke_ocr_cli.rs`）。

### フェーズ3: OCRおよび言語モデル(Gemini API)連携の実装
* **OCR実行部**: PP-OCRv5_Mobile-ONNXモデルを用いて画像からテキストと座標を検出。
* **LLM連携部**: 環境変数 `GEMINI_API_KEY` を使用し、OCRで検出されたテキストをGemini APIに送信。
  * 誤認識の補正、3ヶ国語（日・英・韓）の解釈とマッピング。
  * 指定JSONスキーマ（ポケモンの名前、特性、もちもの、わざ1〜4、ステータスの実数値と能力ポイント）への変換。

### フェーズ4: fixturesを用いた検証とTDD
* `src/test/fixtures` の画像に対して、期待値（アサーション用正解JSONデータ）を定義。
* `cargo test` あるいは CLI の検証モード（`--verify`）で、実際に画像から正しく情報がパースできるかテストを行い、精度を調整する。
