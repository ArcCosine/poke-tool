# 14_OnnxOCRによるPython画像テキスト抽出スクリプト作成およびテスト計画

本計画は、`OnnxOCR` を利用したPythonスクリプトを作成し、`src/test/fixtures` ディレクトリ内のすべてのテスト画像から、日本語・英語・韓国語のテキストおよびその位置情報（座標）を抽出・保存する手順を定義します。

---

## 1. 目的と要件
* **目的**: ブラウザ側でのWASM OCR導入に先立ち、`OnnxOCR` (ONNX PaddleOCR) の多言語認識精度および座標取得の正確性をPythonで検証する。
* **要件**:
  1. `scripts` ディレクトリ以下にPythonスクリプト（例: `scripts/run_onnx_ocr.py`）を作成する。
  2. `src/test/fixtures` ディレクトリ内のすべての画像（`.png`, `.jpg`, `.jpeg`）を読み込む。
  3. 日本語 (ja)、英語 (en)、韓国語 (ko) のテキストが検出できるようにする。
     * ※ `2.jpg` および `3.jpg` に韓国語が含まれているため、韓国語用モデルを適用してこれらを認識可能にする。
  4. 検出されたテキストの内容、信頼度（スコア）、およびその位置（バウンディングボックスの座標）を取得する。
  5. 抽出結果をテキストファイル（例: `onnx_ocr_fixtures_output.txt`）に出力し保存する。

---

## 2. 実装および検証手順

### ステップ 1: 韓国語用ONNXモデルおよび辞書の取得
* `scripts/ocr_models/korean/` ディレクトリを作成する。
* Hugging Face (`monkt/paddleocr-onnx`) 等より、韓国語認識用のONNXモデル (`rec.onnx`) および辞書ファイル (`dict.txt`) をダウンロードして配置する。
  * モデルURL: `https://huggingface.co/monkt/paddleocr-onnx/resolve/main/languages/korean/rec.onnx`
  * 辞書URL: `https://huggingface.co/monkt/paddleocr-onnx/resolve/main/languages/korean/dict.txt`

### ステップ 2: Pythonスクリプトの修正 (`scripts/run_onnx_ocr.py`)
* スクリプトを以下のように多言語対応に改修します。
  * デフォルト（日本語・英語・中国語対応）の OCR モデルと、ダウンロードした韓国語専用 OCR モデルの2種類を用意する。
  * 韓国語が含まれる画像（`2.jpg` および `3.jpg`）に対しては、韓国語モデルを適用してOCRを実行する。
  * その他の画像に対してはデフォルトモデルを適用してOCRを実行する。
  * 結果を整形し、ファイルに出力する。

### ステップ 3: スクリプトの実行
以前構築した Python 仮想環境 `.venv` を使用して、スクリプトを実行します。
```bash
./.venv/bin/python scripts/run_onnx_ocr.py
```

### ステップ 4: 出力結果の確認
* 出力されたテキストファイル（`onnx_ocr_fixtures_output.txt`）を開き、以下の点を確認します。
  * `2.jpg` および `3.jpg` から、韓国語（ハングル）が正しく認識され、漢字や記号に誤認識されずに抽出できているか。
  * 日本語、英語の文字が文字化けせず、正しく認識されているか。
  * テキストの座標（位置情報）が正しく出力されているか。

---

## 3. 合意形成
この計画についてユーザーに同意を求めます。
同意が得られ次第、上記ステップに基づき実装とテストを実行します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **韓国語用ONNXモデルおよび辞書の取得**:
   * [`scripts/ocr_models/korean/`](file:///home/arccosine/poke-tool/scripts/ocr_models/korean) ディレクトリを作成し、Hugging Face の `monkt/paddleocr-onnx` リポジトリから韓国語用の `rec.onnx` モデルと `dict.txt` 辞書ファイルをダウンロードして配置しました。
2. **Pythonスクリプトの修正**:
   * [`scripts/run_onnx_ocr.py`](file:///home/arccosine/poke-tool/scripts/run_onnx_ocr.py) を更新し、デフォルトモデル（日本語・英語・中国語用）と韓国語モデルのハイブリッド処理ができるようにしました。
   * 韓国語のテキストが含まれる画像 `2.jpg` および `3.jpg` に対しては、自動的に韓国語用のOCRモデルを使用して認識するように切り替えるロジックを実装しました。
3. **スクリプトの実行と動作確認**:
   * 仮想環境の Python にてスクリプトを実行し、プロジェクトルートの [`onnx_ocr_fixtures_output.txt`](file:///home/arccosine/poke-tool/onnx_ocr_fixtures_output.txt) に結果が出力されました。
   * 日本語、英語のほか、`2.jpg` および `3.jpg` に含まれる韓国語（ハングル）が正確に（「슬롯7」「팀ID」「팬텀」「능력」「스테이터스」など）検出され、バウンディングボックスの座標も正確に出力されていることを確認しました。



