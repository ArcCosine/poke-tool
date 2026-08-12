---
name: add-regulation
description: ポケモンチャンピオンズの新しいレギュレーションと対象ポケモンを追加するスキル
---

# レギュレーション追加スキル

本スキルは、ポケモンチャンピオンズで新しいレギュレーション（例: レギュレーションM-C）が追加された際に、開発エージェントが安全かつ自動的にデータ更新とUIへの反映を行うための手順ガイドです。

## 前提条件
- `npm` と `npx` がインストールされていること。
- Node.js 環境で `tsx` が利用可能であること。

## 自動追加手順

レギュレーションの追加は、用意されている自動化スクリプト [`add_regulation.ts`](file:///home/arccosine/poke-tool/scripts/add_regulation.ts) を使用して行います。

### 1. 追加コマンドの実行
ターミナルで以下のコマンドを実行します。

```bash
npx tsx scripts/add_regulation.ts <ID> <日本語表示名> <英語表示名> [解禁されるポケモンID（カンマ区切り）]
```

#### 引数の詳細
- `<ID>`: レギュレーションの識別コード（例: `M-C`）。
- `<日本語表示名>`: UIに表示される日本語名（例: `"レギュレーションM-C"`）。
- `<英語表示名>`: UIに表示される英語名（例: `"Regulation M-C"`）。
- `[解禁されるポケモンID]`: （任意）このレギュレーションで新しく追加・解禁されるポケモンの全国図鑑ID。複数ある場合はカンマ `,` で区切って指定します（例: `979,1000`）。
  ※初期実装のポケモン（すでにM-A等で使えるもの）は自動的に引き継がれるため、ここに指定する必要はありません。

#### 実行例
```bash
npx tsx scripts/add_regulation.ts M-C "レギュレーションM-C" "Regulation M-C" 979,1000
```

### 2. スクリプトの自動処理内容
このスクリプトは内部で以下のファイルを自動更新します：
1. **[`src/data/regulations.json`](file:///home/arccosine/poke-tool/src/data/regulations.json)**:
   - UIのセレクトボックスの選択肢となるメタデータを追加します。
2. **[`scripts/regulations_config.json`](file:///home/arccosine/poke-tool/scripts/regulations_config.json)**:
   - 新規解禁ポケモンの構成ルール（`new_pokemon_ids`）を追記します。
3. **PokeAPIクローラーの自動実行 (`npm run update-data`)**:
   - `fetch_pokeapi.ts` を実行し、更新されたルールに基づいて [`src/data/pokemon_master.json`](file:///home/arccosine/poke-tool/src/data/pokemon_master.json) を再生成します。各ポケモンの `regulations` フィールドが累積ルールに従って自動的に更新されます。

---

## 手動追加手順（トラブルシューティング用）

もし自動化スクリプトが使えない場合は、手動で以下のファイルを編集します。

### 1. `src/data/regulations.json` の編集
末尾に新しいレギュレーションオブジェクトを追加します。

```json
  {
    "id": "M-C",
    "name": {
      "ja": "レギュレーションM-C",
      "en": "Regulation M-C"
    }
  }
```

### 2. `scripts/regulations_config.json` の編集
`regulations` キー配下に、新しいレギュレーションIDを追加し、新規解禁するポケモンのIDを `new_pokemon_ids` に配列として記述します。

```json
  "regulations": {
    "M-C": {
      "description": "Regulation M-C: Added M-C Pokémon.",
      "new_pokemon_ids": [979, 1000]
    }
  }
```

### 3. クローラーの実行
データ更新を行うために、以下のコマンドでクローラーを回します。

```bash
npm run update-data
```

---

## 変更の検証手順 (TDD)
レギュレーション追加後は、テストコードを実行して機能に問題がないか確認してください。

```bash
npx vitest run
```
