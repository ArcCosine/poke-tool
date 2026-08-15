# 13_scripts/onnx_test.py 動作確認および依存ライブラリのインストール計画

`scripts/onnx_test.py` を実行できるようにするため、必要な Python ライブラリをインストールし、動作確認を行う手順を定義します。

---

## 1. 現状確認と課題

### ターゲットスクリプト
`scripts/onnx_test.py` のインポート内容:
* `cv2` (opencv-python)
* `onnxocr.onnx_paddleocr` (onnxocr)

### 課題
* システムの Python (`Python 3.12.3`) に直接インストールしようとすると、OS（Debian/Ubuntu等）の `externally-managed-environment` (PEP 668) 制限によりエラーが発生する可能性があります。
* プロジェクトのクリーンさを保ち、他の開発メンバーや依存関係との競合を避けるため、仮想環境を利用したインストールを行います。

---

## 2. 実装手順（アプローチ）

以下の手順で安全に Python 環境を構築し、テストを実行します。

### ステップ 1: Python 仮想環境の作成
プロジェクトルートにおいて、Python 3 標準 of `venv` モジュールを使用し仮想環境 `.venv` を作成します。
```bash
python3 -m venv .venv
```

### ステップ 2: pip のアップデート
仮想環境内の `pip` を最新化します。
```bash
.venv/bin/pip install --upgrade pip
```

### ステップ 3: 必要なライブラリのインストール
`scripts/onnx_test.py` が依存している `opencv-python` および `onnxocr` をインストールします。
```bash
.venv/bin/pip install opencv-python onnxocr
```

### ステップ 4: スクリプトの実行検証
構築した環境で `scripts/onnx_test.py` を実行し、OCR の動作と認識結果が出力されることを確認します。
```bash
.venv/bin/python scripts/onnx_test.py
```

---

## 3. 合意形成

この計画についてユーザーに同意を求めます。
同意が得られ次第、上記ステップに基づきインストールと検証を実行します。

---

## 4. 実行結果 (2026-08-15 完了)

ユーザーの合意のもと、以下の通り実施しました：

1. **Python 仮想環境の作成**: 
   * システムに `python3-venv` (`ensurepip`) がインストールされていなかったため、`python3 -m venv --without-pip .venv` で pip 無しの仮想環境を作成しました。
   * その後、`get-pip.py` をダウンロードして仮想環境 `.venv` 内に pip を手動インストールしました。
2. **依存ライブラリのインストール**:
   * `.venv/bin/pip install opencv-python onnxocr` を実行し、正常にインストールが完了しました。
3. **動作確認検証**:
   * `scripts/` ディレクトリに移動し、`../.venv/bin/python onnx_test.py` を実行しました。
   * テスト用スクリーンショット画像 `src/test/fixtures/Screenshot_20260803-180926.png` から、「ゲッコウガ」や「アシレーヌ」といったポケモン名や各種ステータス数値などが OCR で正常に認識され、スコアとともに出力されることを確認しました。

