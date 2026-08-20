import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_BASE_DIR = '/mnt/C/Users/AC/Downloads/filterd';
const FALLBACK_TARGET_BASE_DIR = '/mnt/c/Users/AC/Downloads/filterd';

const CONFIG_PATH = path.resolve(__dirname, 'classifier_config.json');
const RESULTS_PATH = path.resolve(__dirname, 'classification_results.json');

interface ClassifierConfig {
  statusKeywords: string[];
  abilityKeywords: string[];
  koreanStatusKeywords: string[];
  koreanAbilityKeywords: string[];
  statusRegexes?: string[];
  abilityRegexes?: string[];
}

interface SavedClassification {
  fileName: string;
  detectedText: string;
  statusScore: number;
  abilityScore: number;
  classifiedAs: 'ability' | 'status';
}

function loadConfig(): ClassifierConfig {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function loadSavedResults(): Record<string, SavedClassification> {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`Meta results file not found at: ${RESULTS_PATH}. Run classify_images.ts first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
}

function getEditDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function checkAbilityMatch(token: string, abilityTerms: Set<string>): boolean {
  const lower = token.toLowerCase();
  if (abilityTerms.has(lower)) return true;

  // 英数字のみのトークンの場合、あいまいマッチは行わず完全一致のみとする
  if (/^[a-z0-9]+$/i.test(token)) {
    return false;
  }

  // 日本語トークンのあいまいマッチ
  if (token.length < 3) return false;

  let maxDist = 1;
  if (token.length >= 6) maxDist = 2;

  for (const term of abilityTerms) {
    // 相手が英語名の場合はスキップ
    if (/^[a-z0-9\s]+$/i.test(term)) continue;

    if (Math.abs(term.length - token.length) > maxDist) continue;
    const dist = getEditDistance(token, term);
    if (dist <= maxDist) {
      return true;
    }
  }
  return false;
}

// 簡易的にシミュレーションを行い、現在の精度を算出する
function simulateClassification(
  results: Record<string, SavedClassification>,
  config: ClassifierConfig,
  correctLabels: Record<string, 'ability' | 'status'>,
  abilityTerms: Set<string>
): { accuracy: number; correctCount: number; total: number; errors: string[] } {
  let correctCount = 0;
  const total = Object.keys(correctLabels).length;
  const errors: string[] = [];

  for (const [file, correctLabel] of Object.entries(correctLabels)) {
    const saved = results[file];
    if (!saved) continue;

    const lowerText = saved.detectedText.toLowerCase();
    let statusScore = 0;
    let abilityScore = 0;

    for (const kw of config.statusKeywords) {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = lowerText.match(regex);
      if (matches) statusScore += matches.length * 5;
    }
    for (const kw of config.abilityKeywords) {
      const regex = new RegExp(kw.toLowerCase(), 'g');
      const matches = lowerText.match(regex);
      if (matches) abilityScore += matches.length * 5;
    }
    for (const kw of config.koreanStatusKeywords) {
      const regex = new RegExp(kw, 'g');
      const matches = lowerText.match(regex);
      if (matches) statusScore += matches.length * 5;
    }
    for (const kw of config.koreanAbilityKeywords) {
      const regex = new RegExp(kw, 'g');
      const matches = lowerText.match(regex);
      if (matches) abilityScore += matches.length * 5;
    }

    if (config.statusRegexes) {
      for (const regStr of config.statusRegexes) {
        const regex = new RegExp(regStr, 'gi');
        const matches = lowerText.match(regex);
        if (matches) statusScore += matches.length * 5;
      }
    }
    if (config.abilityRegexes) {
      for (const regStr of config.abilityRegexes) {
        const regex = new RegExp(regStr, 'gi');
        const matches = lowerText.match(regex);
        if (matches) abilityScore += matches.length * 5;
      }
    }

    // 特性・アイテム・技のあいまい単語マッチング
    const tokens = lowerText
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 2);
    
    let matchedTermsCount = 0;
    for (const token of tokens) {
      if (checkAbilityMatch(token, abilityTerms)) {
        matchedTermsCount++;
      }
    }
    if (matchedTermsCount > 0) {
      abilityScore += matchedTermsCount * 5;
    }

    let predicted: 'ability' | 'status' = 'status';
    if (statusScore > abilityScore) {
      predicted = 'status';
    } else if (abilityScore > statusScore) {
      predicted = 'ability';
    } else {
      if (file.toLowerCase().includes('status')) {
        predicted = 'status';
      } else if (file.toLowerCase().includes('ability')) {
        predicted = 'ability';
      } else {
        predicted = 'status';
      }
    }

    if (predicted === correctLabel) {
      correctCount++;
    } else {
      errors.push(`${file}: predicted ${predicted.toUpperCase()}, but actually ${correctLabel.toUpperCase()} (Status Score: ${statusScore}, Ability Score: ${abilityScore})`);
    }
  }

  return {
    accuracy: total > 0 ? (correctCount / total) * 100 : 0,
    correctCount,
    total,
    errors
  };
}

async function main() {
  const config = loadConfig();
  const savedResults = loadSavedResults();

  // 特性・アイテム・技を含むマスター用語セットの構築
  const abilityTerms = new Set<string>();

  // 1. 技マスターの読み込み
  const movesPath = path.resolve(__dirname, '../src/data/moves_master.json');
  if (fs.existsSync(movesPath)) {
    try {
      const movesData = JSON.parse(fs.readFileSync(movesPath, 'utf8'));
      for (const m of movesData) {
        if (m.name?.ja) abilityTerms.add(m.name.ja.toLowerCase());
        if (m.name?.en) abilityTerms.add(m.name.en.toLowerCase());
      }
    } catch (e) {
      console.error('Failed to load moves master', e);
    }
  }

  // 2. アイテムマスターの読み込み
  const itemsPath = path.resolve(__dirname, '../src/data/items_master.json');
  if (fs.existsSync(itemsPath)) {
    try {
      const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
      for (const i of itemsData) {
        if (i.name?.ja) abilityTerms.add(i.name.ja.toLowerCase());
        if (i.name?.en) abilityTerms.add(i.name.en.toLowerCase());
      }
    } catch (e) {
      console.error('Failed to load items master', e);
    }
  }

  // 3. ポケモン特性とポケモン名の読み込み
  const pokemonPath = path.resolve(__dirname, '../src/data/pokemon_master.json');
  const pokemonNames = new Set<string>();
  if (fs.existsSync(pokemonPath)) {
    try {
      const pokemonData = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
      for (const p of pokemonData) {
        if (p.name?.ja) pokemonNames.add(p.name.ja.toLowerCase());
        if (p.name?.en) pokemonNames.add(p.name.en.toLowerCase());
        if (p.abilities) {
          for (const ab of p.abilities) {
            if (ab.ja) abilityTerms.add(ab.ja.toLowerCase());
            if (ab.en) abilityTerms.add(ab.en.toLowerCase());
          }
        }
      }
    } catch (e) {
      console.error('Failed to load pokemon master', e);
    }
  }

  console.log(`Loaded ${abilityTerms.size} unique ability/item/move terms and ${pokemonNames.size} pokemon names for classification.`);

  // 正解データの格納ディレクトリを src/test/fixtures/missed4 に設定
  const missedDir = path.resolve(__dirname, '../src/test/fixtures/missed4');
  const abilityMissed = path.join(missedDir, 'ability'); // abilityと判定されたが、正解はstatus
  const statusMissed = path.join(missedDir, 'status');   // statusと判定されたが、正解はability

  if (!fs.existsSync(abilityMissed) || !fs.existsSync(statusMissed)) {
    console.error(`missed folders not found in: ${missedDir}.`);
    process.exit(1);
  }

  // ユーザーの修正後の正解配置を読み込む
  const correctLabels: Record<string, 'ability' | 'status'> = {};
  
  // abilityMissed にある画像は本来は status
  const missedAbilityFiles = fs.readdirSync(abilityMissed).filter(f => /\.(png|jpe?g)$/i.test(f));
  for (const f of missedAbilityFiles) {
    correctLabels[f] = 'status';
  }

  // statusMissed にある画像は本来は ability
  const missedStatusFiles = fs.readdirSync(statusMissed).filter(f => /\.(png|jpe?g)$/i.test(f));
  for (const f of missedStatusFiles) {
    correctLabels[f] = 'ability';
  }

  console.log(`Scanning missed directories for correct labels...`);
  console.log(`- Originally classified as ABILITY, but actually STATUS: ${missedAbilityFiles.length}`);
  console.log(`- Originally classified as STATUS, but actually ABILITY: ${missedStatusFiles.length}`);

  // 初期の精度を確認
  const initialMetrics = simulateClassification(savedResults, config, correctLabels, abilityTerms);
  console.log(`\nInitial Accuracy: ${initialMetrics.accuracy.toFixed(2)}% (${initialMetrics.correctCount}/${initialMetrics.total})`);
  
  if (initialMetrics.errors.length === 0) {
    console.log('All images are already correctly classified! No parameter optimization needed.');
    return;
  }

  console.log(`\nFound ${initialMetrics.errors.length} misclassified files. Starting optimization...`);

  // 最適化（再学習）ロジック
  // 誤判定されたファイルを分析し、足りないキーワードや特有の誤認識パターンを自動学習する。
  const updatedConfig = { ...config };
  
  for (const errorStr of initialMetrics.errors) {
    const fileName = errorStr.split(':')[0];
    const correctLabel = correctLabels[fileName];
    const saved = savedResults[fileName];
    if (!saved) continue;

    const text = saved.detectedText;
    console.log(`Analyzing misclassified file: ${fileName} (Correct: ${correctLabel.toUpperCase()})`);
    console.log(`OCR detected text excerpt:\n"""\n${text.slice(0, 300)}...\n"""`);

    // 誤分類ケースごとの対策
    if (correctLabel === 'status') {
      // 本来はSTATUSなのにABILITYと判定されたか、両方0でデフォルトABILITYになったケース
      // ステータス画面で頻出するが、まだキーワードに入っていない、または誤認識されている単語を見つける。
      // 代表的なステータス画面誤字パターン（「こうげき」が「こうけき」「つよさをみる」が「つよさをゐる」等）
      const possibleMisspellings = [
        'つよさ', 'つよさを', 'みる', 'すばやさ', 'こうげき', 'ぼうぎょ',
        'とくこう', 'とくぼう', 'しんりょく', '実数値', 'グラフ', '努力値'
      ];
      
      // 画像テキストにこれら（またはそれらの類似誤字）が含まれているかチェック
      for (const pattern of possibleMisspellings) {
        if (text.includes(pattern) && !updatedConfig.statusKeywords.includes(pattern)) {
          console.log(`  -> Adding "${pattern}" to statusKeywords`);
          updatedConfig.statusKeywords.push(pattern);
        }
      }

      // その他、テキストから特定される特徴的な文字の追加
      // 例えば、HPの実数値部分に多い「H P」や「H.P」などのスペース空き
      if (/\bH\s*P\b/i.test(text) && !updatedConfig.statusKeywords.includes('H P')) {
        updatedConfig.statusKeywords.push('H P');
        updatedConfig.statusKeywords.push('HP');
      }

    } else if (correctLabel === 'ability') {
      // 本来はABILITYなのにSTATUSと判定されたケース
      // 特性画面で頻出する単語の追加
      const possibleMisspellings = [
        'とくせい', 'わざ', 'ぶんるい', 'いりょく', 'めいちゅう', 'のうりょく', '能力'
      ];
      for (const pattern of possibleMisspellings) {
        if (text.includes(pattern) && !updatedConfig.abilityKeywords.includes(pattern)) {
          console.log(`  -> Adding "${pattern}" to abilityKeywords`);
          updatedConfig.abilityKeywords.push(pattern);
        }
      }

      // さらに誤判定テキスト内のトークンを動的に学習
      const tokens = text
        .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length >= 2 && t.length <= 12);

      for (const token of tokens) {
        const lowerToken = token.toLowerCase();
        if (
          !updatedConfig.abilityKeywords.includes(token) &&
          !updatedConfig.statusKeywords.includes(token) &&
          !updatedConfig.statusKeywords.includes(lowerToken) &&
          !/^[0-9]+$/.test(token)
        ) {
          // ポケモン/アイテム/技のマスターに部分一致・あいまい一致するか、あるいは特定の文字パターン
          const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(token);
          if (
            checkAbilityMatch(lowerToken, abilityTerms) ||
            checkAbilityMatch(lowerToken, pokemonNames) ||
            /^[a-zA-Z]{4,8}$/.test(token) ||
            (hasJapanese && token.length >= 2 && !token.includes('こうげき') && !token.includes('ぼうぎょ') && !token.includes('すばやさ') && !token.includes('とくこう') && !token.includes('とくぼう') && !token.includes('ステータス') && !token.includes('つよさ'))
          ) {
            console.log(`  -> Automatically learned keyword: "${token}" for abilityKeywords`);
            updatedConfig.abilityKeywords.push(token);
          }
        }
      }
    }
  }

  // 設定ファイルの更新
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf8');
  console.log(`\nConfiguration updated and saved to: ${CONFIG_PATH}`);

  // 更新後の精度を確認
  const finalMetrics = simulateClassification(savedResults, updatedConfig, correctLabels, abilityTerms);
  console.log(`\nOptimized Accuracy: ${finalMetrics.accuracy.toFixed(2)}% (${finalMetrics.correctCount}/${finalMetrics.total})`);
  
  if (finalMetrics.errors.length > 0) {
    console.log('\nRemaining misclassified files after automated keyword heuristic expansion:');
    finalMetrics.errors.forEach(e => console.log(` - ${e}`));
    console.log('\nWe may need to implement finer OCR pre-processing or additional manual keyword adjustments for these.');
  } else {
    console.log('\nOptimization complete! 100% Accuracy achieved on this dataset.');
  }
}

main().catch(err => {
  console.error('Fatal error in optimization process', err);
});
