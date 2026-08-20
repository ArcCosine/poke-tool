import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.resolve(__dirname, '../src/test/fixtures/filterd');
// ユーザーが指定した Windows 側のマウントパス
const TARGET_BASE_DIR = '/mnt/C/Users/AC/Downloads/filterd';
const FALLBACK_TARGET_BASE_DIR = '/mnt/c/Users/AC/Downloads/filterd';

const CONFIG_PATH = path.resolve(__dirname, 'classifier_config.json');
const RESULTS_PATH = path.resolve(__dirname, 'classification_results.json');

function getImageSize(filePath: string): { width: number; height: number } {
  const buffer = fs.readFileSync(filePath);
  
  // PNG
  if (buffer.readUInt32BE(0) === 0x89504e47) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (offset + 4 > buffer.length) break;
      const marker = buffer.readUInt16BE(offset);
      offset += 2;
      
      // SOF0 (Start of Frame 0) marker or SOF2 (Progressive)
      if (marker === 0xffc0 || marker === 0xffc2) {
        if (offset + 7 > buffer.length) break;
        // Skip length (2 bytes) and precision (1 byte)
        const height = buffer.readUInt16BE(offset + 3);
        const width = buffer.readUInt16BE(offset + 5);
        return { width, height };
      } else {
        if (offset + 2 > buffer.length) break;
        const length = buffer.readUInt16BE(offset);
        offset += length;
      }
    }
  }
  
  // デフォルトの16:9解像度
  return { width: 1280, height: 720 };
}

function parsePNG(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  if (
    buffer.readUInt32BE(0) !== 0x89504e47 ||
    buffer.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    throw new Error('Not a valid PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatBuffers: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatBuffers);
  const decompressed = zlib.inflateSync(compressed);

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const output = new Uint8ClampedArray(width * height * 4);

  let readOffset = 0;
  const prevRow = new Uint8Array(stride);
  const currRow = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[readOffset++];
    const rowData = decompressed.subarray(readOffset, readOffset + stride);
    readOffset += stride;

    for (let x = 0; x < stride; x++) {
      const val = rowData[x];
      const a = x >= bytesPerPixel ? currRow[x - bytesPerPixel] : 0;
      const b = prevRow[x];
      const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

      let unfiltered = 0;
      if (filterType === 0) {
        unfiltered = val;
      } else if (filterType === 1) {
        unfiltered = (val + a) & 0xff;
      } else if (filterType === 2) {
        unfiltered = (val + b) & 0xff;
      } else if (filterType === 3) {
        unfiltered = (val + Math.floor((a + b) / 2)) & 0xff;
      } else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = 0;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        else pr = c;
        unfiltered = (val + pr) & 0xff;
      }
      currRow[x] = unfiltered;
    }

    for (let x = 0; x < width; x++) {
      const outIdx = (y * width + x) * 4;
      const inIdx = x * bytesPerPixel;
      if (bytesPerPixel === 4) {
        output[outIdx] = currRow[inIdx];
        output[outIdx + 1] = currRow[inIdx + 1];
        output[outIdx + 2] = currRow[inIdx + 2];
        output[outIdx + 3] = currRow[inIdx + 3];
      } else {
        output[outIdx] = currRow[inIdx];
        output[outIdx + 1] = currRow[inIdx + 1];
        output[outIdx + 2] = currRow[inIdx + 2];
        output[outIdx + 3] = 255;
      }
    }
    prevRow.set(currRow);
  }

  return { width, height, data: output };
}

function get169BoundsRobust(rawPixels: Uint8ClampedArray, w: number, h: number): number[] {
  const rowDiffs = new Float32Array(h);
  const xStart = Math.floor(w * 0.25);
  const xEnd = Math.floor(w * 0.75);
  const scanW = xEnd - xStart;

  for (let y = 0; y < h; y++) {
    let diffSum = 0;
    for (let x = xStart + 1; x < xEnd; x++) {
      const idx1 = (y * w + x) * 4;
      const idx2 = (y * w + x - 1) * 4;
      if (idx1 + 2 < rawPixels.length) {
        const r1 = rawPixels[idx1];
        const g1 = rawPixels[idx1 + 1];
        const b1 = rawPixels[idx1 + 2];
        const r2 = rawPixels[idx2];
        const g2 = rawPixels[idx2 + 1];
        const b2 = rawPixels[idx2 + 2];
        diffSum += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      }
    }
    rowDiffs[y] = diffSum / scanW;
  }

  const threshold = 2.5;
  let top = 0;
  for (let y = 0; y < h; y++) {
    if (rowDiffs[y] > threshold) {
      top = y;
      break;
    }
  }
  let bottom = h - 1;
  for (let y = h - 1; y >= 0; y--) {
    if (rowDiffs[y] > threshold) {
      bottom = y;
      break;
    }
  }

  const colDiffs = new Float32Array(w);
  const yStart = Math.floor(h * 0.25);
  const yEnd = Math.floor(h * 0.75);
  const scanH = yEnd - yStart;

  for (let x = 0; x < w; x++) {
    let diffSum = 0;
    for (let y = yStart + 1; y < yEnd; y++) {
      const idx1 = (y * w + x) * 4;
      const idx2 = ((y - 1) * w + x) * 4;
      if (idx1 + 2 < rawPixels.length) {
        const r1 = rawPixels[idx1];
        const g1 = rawPixels[idx1 + 1];
        const b1 = rawPixels[idx1 + 2];
        const r2 = rawPixels[idx2];
        const g2 = rawPixels[idx2 + 1];
        const b2 = rawPixels[idx2 + 2];
        diffSum += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      }
    }
    colDiffs[x] = diffSum / scanH;
  }

  let left = 0;
  for (let x = 0; x < w; x++) {
    if (colDiffs[x] > threshold) {
      left = x;
      break;
    }
  }
  let right = w - 1;
  for (let x = w - 1; x >= 0; x--) {
    if (colDiffs[x] > threshold) {
      right = x;
      break;
    }
  }

  const viewportW = right - left + 1;
  const viewportH = bottom - top + 1;

  const aspect = viewportW / viewportH;
  const targetAspect = 16.0 / 9.0;

  if (Math.abs(aspect - targetAspect) < 0.02) {
    return [left, top, viewportW, viewportH];
  } else if (aspect > targetAspect) {
    const displayW = Math.round(viewportH * targetAspect);
    const xOffset = left + Math.floor((viewportW - displayW) / 2);
    return [xOffset, top, displayW, viewportH];
  } else {
    const displayH = Math.round(viewportW / targetAspect);
    const yOffset = top + Math.floor((viewportH - displayH) / 2);
    return [left, yOffset, viewportW, displayH];
  }
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

function cropToBMPBufferBinarized(
  rgbaData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): Buffer {
  const rowSize = Math.floor((cropW * 24 + 31) / 32) * 4;
  const pixelDataSize = rowSize * cropH;
  const fileSize = 54 + pixelDataSize;

  const buffer = Buffer.alloc(fileSize);

  // File Header
  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6);
  buffer.writeUInt32LE(54, 10);

  // BITMAPINFOHEADER
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(cropW, 18);
  buffer.writeInt32LE(cropH, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(pixelDataSize, 34);
  buffer.writeInt32LE(2835, 38);
  buffer.writeInt32LE(2835, 42);
  buffer.writeUInt32LE(0, 46);
  buffer.writeUInt32LE(0, 50);

  // Pixel Data (bottom-to-top BGR)
  let offset = 54;
  for (let y = cropH - 1; y >= 0; y--) {
    const srcRow = cropY + y;
    const srcRowOffset = srcRow * srcW * 4;
    for (let x = 0; x < cropW; x++) {
      const srcX = cropX + x;
      const srcIdx = srcRowOffset + srcX * 4;
      const r = rgbaData[srcIdx];
      const g = rgbaData[srcIdx + 1];
      const b = rgbaData[srcIdx + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // 二値化（文字を黒、背景を白に際立たせる）
      const binVal = gray > 140 ? 255 : 0;

      buffer[offset++] = binVal;
      buffer[offset++] = binVal;
      buffer[offset++] = binVal;
    }
    const padding = rowSize - (cropW * 3);
    for (let p = 0; p < padding; p++) {
      buffer[offset++] = 0;
    }
  }

  return buffer;
}

interface ClassifierConfig {
  statusKeywords: string[];
  abilityKeywords: string[];
  koreanStatusKeywords: string[];
  koreanAbilityKeywords: string[];
  statusRegexes?: string[];
  abilityRegexes?: string[];
}

function loadConfig(): ClassifierConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.error('Failed to parse config file, using default values', e);
    }
  }
  return {
    statusKeywords: ['ステータス', 'つよさをみる', 'Stats', 'HP', 'こうげき', 'ぼうぎょ', 'とくこう', 'とくぼう', 'すばやさ'],
    abilityKeywords: ['のうりょく', '能力', 'Moves', '特性', 'とくせい', 'わざ', 'わざをみる'],
    koreanStatusKeywords: ['스테이터스', '능력치'],
    koreanAbilityKeywords: ['능력', '기술'],
    statusRegexes: ['\\+[0-9]+', '\\b(hp|at[tk]|def|sp\\.?a|sp\\.?d|spe)\\b'],
    abilityRegexes: ['pp\\s*\\d+/\\d+', '\\b(タイプ|ぶんるい|いりょく|めいちゅう)\\b']
  };
}

async function main() {
  const config = loadConfig();

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

  // 3. ポケモン特性の読み込み
  const pokemonPath = path.resolve(__dirname, '../src/data/pokemon_master.json');
  if (fs.existsSync(pokemonPath)) {
    try {
      const pokemonData = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
      for (const p of pokemonData) {
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

  console.log(`Loaded ${abilityTerms.size} unique ability/item/move terms for classification.`);

  // 対象出力先ディレクトリの決定 (大文字Cがマウントされていない場合は小文字cを試す)
  let targetDir = TARGET_BASE_DIR;
  try {
    // ディレクトリが存在するか、あるいは作成できるかチェック
    fs.mkdirSync(targetDir, { recursive: true });
  } catch (err) {
    console.warn(`Could not create/write to ${TARGET_BASE_DIR}. Trying fallback: ${FALLBACK_TARGET_BASE_DIR}`);
    targetDir = FALLBACK_TARGET_BASE_DIR;
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const abilityDest = path.join(targetDir, 'ability');
  const statusDest = path.join(targetDir, 'status');

  fs.mkdirSync(abilityDest, { recursive: true });
  fs.mkdirSync(statusDest, { recursive: true });

  console.log(`Input Directory: ${FIXTURES_DIR}`);
  console.log(`Output Directory (Ability): ${abilityDest}`);
  console.log(`Output Directory (Status): ${statusDest}`);

  if (!fs.existsSync(FIXTURES_DIR)) {
    console.error(`Source directory does not exist: ${FIXTURES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(FIXTURES_DIR).filter(file => /\.(png|jpe?g)$/i.test(file));
  console.log(`Found ${files.length} images to classify.`);

  // Tesseract Worker 初期化
  console.log('Initializing Tesseract worker (jpn+eng+kor)...');
  const worker = await Tesseract.createWorker('jpn+eng+kor', 1, {
    langPath: path.resolve(__dirname, '../tessdata'),
    cachePath: path.resolve(__dirname, '../tessdata'),
    gzip: false,
  });

  const results: Record<string, {
    fileName: string;
    detectedText: string;
    statusScore: number;
    abilityScore: number;
    classifiedAs: 'ability' | 'status';
  }> = {};

  let count = 0;
  for (const file of files) {
    count++;
    const filePath = path.join(FIXTURES_DIR, file);
    const size = getImageSize(filePath);
    console.log(`[${count}/${files.length}] Analyzing ${file} (${size.width}x${size.height})...`);

    try {
      let ocrInput: any = filePath;
      let recognizeOptions: any = {};

      if (file.toLowerCase().endsWith('.png')) {
        try {
          const pngInfo = parsePNG(filePath);
          const bounds = get169BoundsRobust(pngInfo.data, pngInfo.width, pngInfo.height);
          const vx = bounds[0];
          const vy = bounds[1];
          const vw = bounds[2];
          const vh = bounds[3];

          const startX = Math.floor(vx + vw * 0.45);
          const startY = Math.floor(vy + vh * 0.01);
          const cropW = Math.floor(vw * 0.5);
          const cropH = Math.floor(vh * 0.98);

          const bmpBuffer = cropToBMPBufferBinarized(
            pngInfo.data,
            pngInfo.width,
            pngInfo.height,
            startX,
            startY,
            cropW,
            cropH
          );
          ocrInput = bmpBuffer;
          recognizeOptions = {};
        } catch (e) {
          console.warn(`  Failed to parse PNG viewport for ${file}, fallback to simple crop:`, e);
          const startX = Math.floor(size.width * 0.45);
          const startY = Math.floor(size.height * 0.01);
          const w = Math.floor(size.width * 0.5);
          const h = Math.floor(size.height * 0.98);
          ocrInput = filePath;
          recognizeOptions = { rectangle: { left: startX, top: startY, width: w, height: h } };
        }
      } else {
        const startX = Math.floor(size.width * 0.45);
        const startY = Math.floor(size.height * 0.01);
        const w = Math.floor(size.width * 0.5);
        const h = Math.floor(size.height * 0.98);
        ocrInput = filePath;
        recognizeOptions = { rectangle: { left: startX, top: startY, width: w, height: h } };
      }

      const { data: { text } } = await worker.recognize(ocrInput, recognizeOptions);
      
      // スコア計算
      let statusScore = 0;
      let abilityScore = 0;

      const lowerText = text.toLowerCase();

      // 日本語/英語キーワードのカウント（マッチごとに5点）
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

      // 韓国語キーワードのカウント（マッチごとに5点）
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

      // 正規表現による特徴検出（マッチ数×5点）
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

      // 特性・アイテム・技のあいまい単語マッチング（マッチごとに5点）
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

      // 分類決定
      let classifiedAs: 'ability' | 'status' = 'status';
      if (statusScore > abilityScore) {
        classifiedAs = 'status';
      } else if (abilityScore > statusScore) {
        classifiedAs = 'ability';
      } else {
        // 同点の場合はファイル名から推測
        if (file.toLowerCase().includes('status')) {
          classifiedAs = 'status';
        } else if (file.toLowerCase().includes('ability')) {
          classifiedAs = 'ability';
        } else {
          // デフォルト
          classifiedAs = 'status';
        }
      }

      // ファイルコピー (EPERM対策としてwriteFileSyncを使用)
      const destPath = path.join(classifiedAs === 'status' ? statusDest : abilityDest, file);
      fs.writeFileSync(destPath, fs.readFileSync(filePath));

      console.log(`  -> Classified as: ${classifiedAs.toUpperCase()} (Status Score: ${statusScore}, Ability Score: ${abilityScore})`);

      results[file] = {
        fileName: file,
        detectedText: text,
        statusScore,
        abilityScore,
        classifiedAs
      };
    } catch (e) {
      console.error(`Failed to process file ${file}`, e);
    }
  }

  await worker.terminate();

  // 分類結果のメタデータを保存
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nClassification completed. Results meta-data saved to: ${RESULTS_PATH}`);
}

main().catch(err => {
  console.error('Fatal error in main process', err);
});
