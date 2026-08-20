import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function detectActiveSlotIndex(
  rgbaData: Uint8ClampedArray,
  imgWidth: number,
  imgHeight: number,
  xOffset: number,
  yOffset: number,
  displayW: number,
  displayH: number
): number {
  const startX = Math.floor(xOffset + displayW * 0.05);
  const endX = Math.floor(xOffset + displayW * 0.35);
  const startY = Math.floor(yOffset + displayH * 0.15);
  const endY = Math.floor(yOffset + displayH * 0.90);
  const slotHeight = (endY - startY) / 6;

  let activeSlotIdx = 0;
  let maxScore = -Infinity;

  for (let i = 0; i < 6; i++) {
    const sY = Math.floor(startY + i * slotHeight);
    const eY = Math.floor(startY + (i + 1) * slotHeight);

    let greenSum = 0;
    let count = 0;

    for (let y = sY; y < eY; y += 2) {
      if (y >= imgHeight) continue;
      const rowOffset = y * imgWidth * 4;
      for (let x = startX; x < endX; x += 2) {
        if (x >= imgWidth) continue;
        const idx = rowOffset + x * 4;
        if (idx < rgbaData.length - 4) {
          const r = rgbaData[idx];
          const g = rgbaData[idx + 1];
          const b = rgbaData[idx + 2];
          const score = g - r;
          greenSum += score;
          count++;
        }
      }
    }

    const avgScore = count > 0 ? greenSum / count : 0;
    if (avgScore > maxScore) {
      maxScore = avgScore;
      activeSlotIdx = i;
    }
  }

  return activeSlotIdx;
}

function cropToBMPBuffer(
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

      buffer[offset++] = b;
      buffer[offset++] = g;
      buffer[offset++] = r;
    }
    const padding = rowSize - (cropW * 3);
    for (let p = 0; p < padding; p++) {
      buffer[offset++] = 0;
    }
  }

  return buffer;
}

const DATA_DIR = path.resolve(__dirname, '../src/data');
const FIXTURES_DIR = path.resolve(__dirname, '../src/test/fixtures');
const OUTPUT_FILE = path.resolve(__dirname, '../ocr_fixture_results.txt');

const KOREAN_TRANSLATION_MAP: {
  pokemons: Record<string, string>;
  abilities: Record<string, string>;
  items: Record<string, string>;
  moves: Record<string, string>;
} = {
  pokemons: {
    '팬텀': 'ゲンガー',
    '삼삼드래': 'サザンドラ',
    '메타그로스': 'メタグロス',
    '아머까오': 'アーマーガア',
    '한카리아스': 'ガブリアス',
    '누리레느': 'アシレーヌ',
    '로톰': 'ロトム',
    '푸테라': 'プテラ',
    '프테라': 'プテラ',
    '쁘사이저': 'カイロス',
    '독침붕': 'スピアー',
    '파이어로': 'ファイアロー',
  },
  abilities: {
    '저주받은바디': 'のろわれボディ',
    '부유': 'ふゆう',
    '클리어바디': 'クリアボディ',
    '프레셔': 'プレッシャー',
    '까칠한피부': 'さめはだ',
    '급류': 'げきりゅう',
    '이각': 'いかく',
    '위각': 'いかく',
    '위협': 'いかく',
    '괴력집게': 'かいりきばさみ',
    '우격다짐': 'ちからずく',
    '틀깨기': 'かたやぶり',
    '자기과신': 'じしんかじょう',
    '벌레의알림': 'むしのしらせ',
    '스나이퍼': 'スナイパー',
    '적응력': 'てきおうりょく',
    '질풍날개': 'はやてのつばさ',
  },
  items: {
    '팬텀나이트': 'ゲンガナイト',
    '메타그로스나이트': 'メタグロスナイト',
    '쁘사이저나이트': 'カイロスナイト',
    '구애스카프': 'こだわりスカーフ',
    '먹다남은음식': 'たべのこし',
    '기합의띠': 'きあいのタスキ',
    '자몽열매': 'オボンのみ',
    '생명의구슬': 'いのちのたま',
    '구애머리띠': 'こだわりハチマキ',
    '구애안경': 'こだわりメガネ',
    '돌격조끼': '突撃チョッキ',
  },
  moves: {
    '새도볼': 'シャドーボール',
    '섀도볼': 'シャドーボール',
    '오물웨이브': 'ヘドロウェーブ',
    '길동무': 'みちづれ',
    '방어': 'まもる',
    '용성군': 'りゅうせいぐん',
    '악의파동': 'あくのはどう',
    '불대문자': 'だいもんじ',
    '유턴': 'とんぼがえり',
    '사이코팽': 'サイコファング',
    '불릿펀치': 'バレットパンチ',
    '암해머': 'アームハンマー',
    '번개펀치': 'かみなりパンチ',
    '바디프레스': 'ボディプレス',
    '철벽': 'てっぺき',
    '날개쉬기': 'はねやすめ',
    '지진': 'じしん',
    '스케일샷': 'スケイルショット',
    '칼춤': 'つるぎのまい',
    '스텔스록': 'ステルスロック',
    '문포스': 'ムーンフォース',
    '물거품아리아': 'うたかたのアリア',
    '아쿠아제트': 'アクアジェット',
    '명상': 'めいそう',
    '볼트체인지': 'ボルトチェンジ',
    '하품': 'あくび',
    '병상첨병': 'たたりめ',
    '대타출동': 'みがわり',
    '오물폭탄': 'ヘドロばくだん',
    '날려버리기': 'ふきとばし',
    '게으름피우기': 'なまける',
    '스톤샤워': 'いわなだれ',
    '시저크로스': 'シザークロス',
    '칼춤 ': 'つるぎのまい',
    '유턴 ': 'とんぼがえり',
    '탁쳐서떨구기': 'はたきおとす',
    '독침': 'どくばり',
    '유턴   ': 'とんぼがえり',
    '순풍': 'おいかぜ',
    '브레이브버드': 'ブレイブバード',
    '플레어드라이브': 'フレアドライブ',
    '날개쉬기 ': 'はねやすめ',
  }
};

interface PokemonMaster {
  id: number;
  name: { ja: string; en: string };
  abilities: { ja: string; en: string }[];
  learnable_moves: number[];
}

interface MoveMaster {
  id: number;
  name: { ja: string; en: string };
}

interface ItemMaster {
  id: number;
  name: { ja: string; en: string };
}

// Levenshtein distance
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
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function hasHangul(text: string): boolean {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

function hasJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

function hasLatin(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

function findBestMatch(
  text: string,
  candidates: string[],
  maxDistanceThreshold = 2
): string | null {
  if (!text) return null;
  if (candidates.includes(text)) {
    return text;
  }
  let bestMatch: string | null = null;
  let minDistance = Infinity;

  const textHasHangul = hasHangul(text);
  const textHasJapanese = hasJapanese(text);
  const textHasLatin = hasLatin(text);

  for (const candidate of candidates) {
    const candHasHangul = hasHangul(candidate);
    const candHasJapanese = hasJapanese(candidate);
    const candHasLatin = hasLatin(candidate);

    if (candHasHangul && !textHasHangul) continue;
    if (candHasJapanese && !textHasJapanese) continue;
    if (candHasLatin && !candHasHangul && !candHasJapanese && !textHasLatin) continue;

    // Hybrid thresholds to prevent short/cross-script garbage matches
    let currentThreshold = maxDistanceThreshold;
    if (candHasLatin && !candHasHangul && !candHasJapanese) {
      currentThreshold = 1;
    } else if (candidate.length <= 1) {
      currentThreshold = 0;
    } else if (candidate.length <= 3) {
      currentThreshold = 1;
    }

    const dist = getEditDistance(text, candidate);
    if (dist < minDistance && dist <= currentThreshold) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }
  return bestMatch;
}

function findBestSubmatch(
  combinedText: string,
  candidates: string[],
  maxDistanceThreshold = 2
): string | null {
  if (!combinedText) return null;
  let bestMatch: string | null = null;
  let minDistance = Infinity;

  const textHasHangul = hasHangul(combinedText);
  const textHasJapanese = hasJapanese(combinedText);
  const textHasLatin = hasLatin(combinedText);

  for (const candidate of candidates) {
    if (candidate.length < 2) continue;

    const candHasHangul = hasHangul(candidate);
    const candHasJapanese = hasJapanese(candidate);
    const candHasLatin = hasLatin(candidate);

    if (candHasHangul && !textHasHangul) continue;
    if (candHasJapanese && !textHasJapanese) continue;
    if (candHasLatin && !candHasHangul && !candHasJapanese && !textHasLatin) continue;

    // Hybrid thresholds for submatch
    let currentThreshold = maxDistanceThreshold;
    if (candHasLatin && !candHasHangul && !candHasJapanese) {
      currentThreshold = 1;
    } else if (candidate.length <= 1) {
      currentThreshold = 0;
    } else if (candidate.length <= 3) {
      currentThreshold = 1;
    }

    const len = candidate.length;
    if (combinedText.length < len) {
      const dist = getEditDistance(combinedText, candidate);
      if (dist < minDistance && dist <= currentThreshold) {
        minDistance = dist;
        bestMatch = candidate;
      }
      continue;
    }

    for (let i = 0; i <= combinedText.length - len; i++) {
      const slice = combinedText.substring(i, i + len);
      const dist = getEditDistance(slice, candidate);
      if (dist < minDistance && dist <= currentThreshold) {
        minDistance = dist;
        bestMatch = candidate;
      }
    }

    for (const delta of [-1, 1]) {
      const targetLen = len + delta;
      if (targetLen < 2 || combinedText.length < targetLen) continue;
      for (let i = 0; i <= combinedText.length - targetLen; i++) {
        const slice = combinedText.substring(i, i + targetLen);
        const dist = getEditDistance(slice, candidate);
        if (dist < minDistance && dist <= currentThreshold) {
          minDistance = dist;
          bestMatch = candidate;
        }
      }
    }
  }

  return bestMatch;
}

async function run() {
  let totalPokemonSlotsCount = 0;
  let totalAbilitySlotsCount = 0;
  let totalItemSlotsCount = 0;

  let detectedPokemonCount = 0;
  let detectedAbilityCount = 0;
  let detectedItemCount = 0;

  console.log('Loading database JSON files...');
  let pokemonList: PokemonMaster[] = [];
  let movesList: MoveMaster[] = [];
  let itemsList: ItemMaster[] = [];

  try {
    pokemonList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pokemon_master.json'), 'utf8'));
    movesList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'moves_master.json'), 'utf8'));
    itemsList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'items_master.json'), 'utf8'));
  } catch (e) {
    console.warn('Could not load original database JSONs, using mock definitions.', e);
    // fallback to minimal mock if files not found
  }

  const allPokemonNames = pokemonList.flatMap((p) => [p.name.ja, p.name.en].filter(Boolean));
  const allItemNames = itemsList.flatMap((i) => [i.name.ja, i.name.en].filter(Boolean));

  let files = fs.readdirSync(FIXTURES_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
  const downloadedDir = path.join(FIXTURES_DIR, 'downloaded');
  if (fs.existsSync(downloadedDir)) {
    const downloadedFiles = fs.readdirSync(downloadedDir)
      .filter((f) => /\.(png|jpe?g)$/i.test(f))
      .map((f) => path.join('downloaded', f));
    files = [...files, ...downloadedFiles];
  }
  
  const MAX_VERIFY_IMAGES = 50;
  if (files.length > MAX_VERIFY_IMAGES) {
    console.log(`Limiting verification to first ${MAX_VERIFY_IMAGES} images out of ${files.length} available.`);
    files = files.slice(0, MAX_VERIFY_IMAGES);
  }
  console.log(`Found ${files.length} fixture files to analyze.`);

  let report = '=== OCR TEXT EXTRACTION REPORT FOR FIXTURES ===\n\n';

  // We reuse the worker to speed up and avoid multiple initialization warnings
  console.log('Initializing Tesseract worker...');
  const worker = await Tesseract.createWorker('jpn+eng+kor', 1, {
    langPath: path.resolve(__dirname, '../tessdata'),
    cachePath: path.resolve(__dirname, '../tessdata'),
    gzip: false,
  });

  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    console.log(`Processing: ${file}...`);
    report += `=========================================\n`;
    report += `FILE: ${file}\n`;
    report += `=========================================\n`;

    try {
      let imgWidth = 1920;
      let imgHeight = 1080;
      let xOffset = 0;
      let yOffset = 0;
      let displayW = 1920;
      let displayH = 1080;
      let pngInfoData: Uint8ClampedArray | null = null;

      let ocrInput: any = filePath;

      if (file.toLowerCase().endsWith('.png')) {
        try {
          const pngInfo = parsePNG(filePath);
          pngInfoData = pngInfo.data;
          imgWidth = pngInfo.width;
          imgHeight = pngInfo.height;
          const bounds = get169BoundsRobust(pngInfo.data, pngInfo.width, pngInfo.height);
          xOffset = bounds[0];
          yOffset = bounds[1];
          displayW = bounds[2];
          displayH = bounds[3];
          console.log(`  Robust 16:9 Viewport detected: [x:${xOffset}, y:${yOffset}, w:${displayW}, h:${displayH}] inside original ${imgWidth}x${imgHeight}`);
          
          if (xOffset > 0 || yOffset > 0 || displayW < imgWidth || displayH < imgHeight) {
            const bmpBuffer = cropToBMPBuffer(pngInfo.data, imgWidth, imgHeight, xOffset, yOffset, displayW, displayH);
            ocrInput = bmpBuffer;
            console.log(`  Feeding cropped ${displayW}x${displayH} BMP buffer directly to Tesseract.`);
            xOffset = 0;
            yOffset = 0;
          }
        } catch (err) {
          console.warn(`  Failed to parse PNG metadata for ${file}, fallback to defaults.`, err);
        }
      }

      const result = await worker.recognize(ocrInput, {}, { blocks: true });
      const words: { text: string; x: number; y: number; w: number; h: number }[] = [];
      
      if (result.data.blocks) {
        for (const block of result.data.blocks) {
          if (block.paragraphs) {
            for (const para of block.paragraphs) {
              if (para.lines) {
                for (const line of para.lines) {
                  if (line.words) {
                    for (const w of line.words) {
                      const { x0, y0, x1, y1 } = w.bbox;
                      words.push({
                        text: w.text.trim(),
                        x: x0,
                        y: y0,
                        w: x1 - x0,
                        h: y1 - y0,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      report += `[RAW WORDS DETECTED: ${words.length}]\n`;
      report += words.map((w) => `"${w.text}" (x:${w.x}, y:${w.y}, w:${w.w}, h:${w.h})`).join(', ') + '\n\n';

      // 1. Identify Screen Type (based on move database matching and EV indicators)
      let detectedScreenType: 'ability' | 'status' | 'party' = 'ability';
      const allMoveNames = movesList.flatMap((m) => [m.name.ja, m.name.en].filter(Boolean));
      let detectedMovesCount = 0;
      for (const word of words) {
        if (word.text.length >= 2) {
          const matchedMove = findBestMatch(word.text, allMoveNames, 1);
          if (matchedMove) {
            detectedMovesCount++;
          }
        }
      }

      const hasEvIndicator = words.some((w) =>
        /^(HP)$/i.test(w.text) ||
        /^\+[0-9]+$/.test(w.text)
      );

      const hasStatusKeyword = words.some((w) =>
        /^(스테이터스|ステータス|Stats)$/i.test(w.text)
      );
      const hasAbilityKeyword = words.some((w) =>
        /^(능력|能力|Moves)$/i.test(w.text)
      );
      const hasPartyKeyword = words.some((w) =>
        /^(편성|編成|選んで|Battle|Team|Select|Edit|party)$/i.test(w.text)
      );

      if (hasPartyKeyword) {
        detectedScreenType = 'party';
      } else if (hasStatusKeyword && !hasAbilityKeyword) {
        detectedScreenType = 'status';
      } else if (hasAbilityKeyword && !hasStatusKeyword) {
        detectedScreenType = 'ability';
      } else if (detectedMovesCount >= 2) {
        detectedScreenType = 'ability';
      } else if (hasEvIndicator) {
        detectedScreenType = 'status';
      } else if (detectedMovesCount >= 1) {
        detectedScreenType = 'ability';
      } else {
        detectedScreenType = 'ability';
      }

      // Also check filename as hint for explicit test files
      if (file.toLowerCase().includes('status')) {
        detectedScreenType = 'status';
      } else if (file.toLowerCase().includes('ability')) {
        detectedScreenType = 'ability';
      } else if (file.toLowerCase().includes('party')) {
        detectedScreenType = 'party';
      }

      report += `DETECTED SCREEN TYPE: ${detectedScreenType.toUpperCase()}\n\n`;

      // 2. Partition words into 6 slots
      const slotWords: typeof words[] = Array.from({ length: 6 }, () => []);
      const detailWords: typeof words[] = [];

      let activeSlotIdx = 0; // default to first slot
      if ((detectedScreenType === 'ability' || detectedScreenType === 'status') && pngInfoData) {
        activeSlotIdx = detectActiveSlotIndex(
          pngInfoData,
          imgWidth,
          imgHeight,
          xOffset,
          yOffset,
          displayW,
          displayH
        );
        console.log(`  Pixel analysis: Active slot index detected as SLOT ${activeSlotIdx + 1}`);
      }

      for (const word of words) {
        const cx = word.x + word.w / 2;
        const cy = word.y + word.h / 2;

        const rx = cx - xOffset;
        const ry = cy - yOffset;

        if (detectedScreenType === 'party') {
          // Party screen: 2 columns, 3 rows layout
          const isLeft = rx < displayW * 0.5;
          let row = 0;
          if (ry < displayH * 0.45) {
            row = 0;
          } else if (ry < displayH * 0.66) {
            row = 1;
          } else {
            row = 2;
          }
          const slotIdx = (isLeft ? 0 : 1) + row * 2;
          if (slotIdx >= 0 && slotIdx < 6) {
            slotWords[slotIdx].push(word);
          }
        } else {
          // Ability / Status screen:
          // Left side (x < 40%): Slot list, vertical 6 rows
          if (rx < displayW * 0.40) {
            const startY = displayH * 0.15;
            const endY = displayH * 0.90;
            const slotH = (endY - startY) / 6;
            let slotIdx = Math.floor((ry - startY) / slotH);
            if (slotIdx < 0) slotIdx = 0;
            if (slotIdx > 5) slotIdx = 5;
            slotWords[slotIdx].push(word);
          } else {
            // Right side (x >= 40%): Detail area words
            detailWords.push(word);
          }
        }
      }

      // 3. Resolve details for each slot
      for (let slotIdx = 0; slotIdx < 6; slotIdx++) {
        const sWords = slotWords[slotIdx];
        report += `---- SLOT ${slotIdx + 1} ----\n`;
        totalPokemonSlotsCount++;
        if (sWords.length === 0) {
          report += `  (No words classified in this slot area)\n`;
          continue;
        }

        report += `  Slot Raw Words: ` + sWords.map((w) => `"${w.text}"`).join(', ') + '\n';

        let slotCombinedTextAll = sWords
          .map((w) => w.text.trim())
          .join('')
          .replace(/[•ㅇ※ㅇo•@©=\-\+_\s]+/g, '');

        if ((detectedScreenType === 'ability' || detectedScreenType === 'status') && slotIdx === activeSlotIdx) {
          const detailCombinedText = detailWords
            .map((w) => w.text.trim())
            .join('')
            .replace(/[•ㅇ※ㅇo•@©=\-\+_\s]+/g, '');
          slotCombinedTextAll += detailCombinedText;
        }

        let matchedPokemon: PokemonMaster | null = null;
        let matchedNameStr = '';

        const koPokemonNames = Object.keys(KOREAN_TRANSLATION_MAP.pokemons);
        const pokemonCandidates = [
          ...allPokemonNames,
          ...koPokemonNames
        ];

        const filteredPokemonCandidates = pokemonCandidates.filter(name => {
          if (/^(Defense|Attack|Speed|Special|Level|HP|H|A|B|C|D|S)$/i.test(name)) {
            return false;
          }
          return true;
        });

        const bestMatchName = findBestSubmatch(slotCombinedTextAll, filteredPokemonCandidates, 2);
        if (bestMatchName) {
          let targetJaName = bestMatchName;
          if (KOREAN_TRANSLATION_MAP.pokemons[bestMatchName]) {
            targetJaName = KOREAN_TRANSLATION_MAP.pokemons[bestMatchName];
          }
          const p = pokemonList.find(
            (p) => p.name.ja === targetJaName || p.name.en === targetJaName
          );
          if (p) {
            matchedPokemon = p;
            matchedNameStr = bestMatchName;
          }
        }

        if (!matchedPokemon) {
          report += `  => POKEMON NAME NOT DETECTED (or failed to match DB)\n`;
          continue;
        }

        report += `  => DETECTED POKEMON: ${matchedPokemon.name.ja} (${matchedPokemon.name.en})\n`;
        detectedPokemonCount++;

        let ability = '';
        let item = '';
        const moves: string[] = [];
        const evsMapped = {
          hp: 0,
          attack: 0,
          defense: 0,
          speed: 0,
          sp_defense: 0,
          sp_attack: 0,
        };

        const otherWords = sWords.filter((w) => !matchedNameStr.includes(w.text));
        const slotCombinedText = slotCombinedTextAll.replace(matchedNameStr, '');

        const isAbilityScreen = detectedScreenType === 'ability';
        const isPartyScreen = detectedScreenType === 'party';

        if (isAbilityScreen || isPartyScreen) {
          if (isAbilityScreen && slotIdx === activeSlotIdx) {
            totalAbilitySlotsCount++;
            totalItemSlotsCount++;
          } else if (isPartyScreen) {
            totalItemSlotsCount++;
          }

          // 1. Ability (Only parsed in ABILITY screen for active slot)
          if (isAbilityScreen && slotIdx === activeSlotIdx) {
            const abilityCandidates = [
              ...matchedPokemon.abilities.flatMap((a) => [a.ja, a.en].filter(Boolean)),
              ...Object.keys(KOREAN_TRANSLATION_MAP.abilities)
            ];
            const bestAb = findBestSubmatch(slotCombinedText, abilityCandidates, 2);
            if (bestAb) {
              let targetJaAb = bestAb;
              if (KOREAN_TRANSLATION_MAP.abilities[bestAb]) {
                targetJaAb = KOREAN_TRANSLATION_MAP.abilities[bestAb];
              }
              const matchedAbilityObj = matchedPokemon.abilities.find(
                (a) => a.ja === targetJaAb || a.en === targetJaAb
              );
              if (matchedAbilityObj) {
                ability = matchedAbilityObj.ja;
                detectedAbilityCount++;
              }
            }
          }

          // 2. Item (Parsed in PARTY screen or in ABILITY screen for active slot)
          if (isPartyScreen || (isAbilityScreen && slotIdx === activeSlotIdx)) {
            const itemCandidates = [
              ...allItemNames,
              ...Object.keys(KOREAN_TRANSLATION_MAP.items)
            ];
            const bestItem = findBestSubmatch(slotCombinedText, itemCandidates, 2);
            if (bestItem) {
              let targetJaItem = bestItem;
              if (KOREAN_TRANSLATION_MAP.items[bestItem]) {
                targetJaItem = KOREAN_TRANSLATION_MAP.items[bestItem];
              }
              const matchedItemObj = itemsList.find(
                (i) => i.name.ja === targetJaItem || i.name.en === targetJaItem
              );
              if (matchedItemObj) {
                item = matchedItemObj.name.ja;
                detectedItemCount++;
              }
            }
          }

          // 3. Moves
          if (isPartyScreen || (isAbilityScreen && slotIdx === activeSlotIdx)) {
            const learnableMoveNames = movesList
              .filter((m) => matchedPokemon!.learnable_moves.includes(m.id))
              .flatMap((m) => [m.name.ja, m.name.en].filter(Boolean));

            const moveCandidates = [
              ...learnableMoveNames,
              ...Object.keys(KOREAN_TRANSLATION_MAP.moves)
            ];

            const sortedMoves = [...moveCandidates].sort((a, b) => b.length - a.length);
            let remainingText = slotCombinedText;
            for (const moveName of sortedMoves) {
              const subMatch = findBestSubmatch(remainingText, [moveName], 2);
              if (subMatch) {
                let targetJaMove = subMatch;
                if (KOREAN_TRANSLATION_MAP.moves[subMatch]) {
                  targetJaMove = KOREAN_TRANSLATION_MAP.moves[subMatch];
                }
                const matchedMoveObj = movesList.find(
                  (m) => m.name.ja === targetJaMove || m.name.en === targetJaMove
                );
                if (matchedMoveObj && !moves.includes(matchedMoveObj.name.ja)) {
                  moves.push(matchedMoveObj.name.ja);
                  remainingText = remainingText.replace(subMatch, '');
                }
              }
            }
          }

          report += `     Ability: ${ability || '(Not detected)'}\n`;
          report += `     Item: ${item || '(Not detected)'}\n`;
          report += `     Moves: ${moves.join(', ') || '(None detected)'}\n`;
        } else {
          // EVs
          const evNumMatches: { val: number; y: number; x: number; text: string }[] = [];
          for (const word of otherWords) {
            const m = word.text.match(/^\+?([0-9]+)$/);
            if (m) {
              const val = parseInt(m[1], 10);
              if (val >= 0 && val <= 252) {
                evNumMatches.push({ val, y: word.y, x: word.x, text: word.text });
              }
            }
          }

          const rows: typeof evNumMatches[] = [];
          for (const match of evNumMatches) {
            let added = false;
            for (const row of rows) {
              if (Math.abs(row[0].y - match.y) < 15) {
                row.push(match);
                added = true;
                break;
              }
            }
            if (!added) {
              rows.push([match]);
            }
          }

          rows.sort((a, b) => a[0].y - b[0].y);

          const evKeys: (keyof typeof evsMapped)[] = [
            'hp',
            'attack',
            'defense',
            'sp_attack',
            'sp_defense',
            'speed',
          ];

          for (let i = 0; i < Math.min(6, rows.length); i++) {
            const row = rows[i];
            let bestMatch = row[0];
            for (const m of row) {
              if (m.text.startsWith('+')) {
                bestMatch = m;
                break;
              }
              if (m.x > bestMatch.x) {
                bestMatch = m;
              }
            }
            evsMapped[evKeys[i]] = bestMatch.val;
          }

          report += `     EVs => H:${evsMapped.hp}, A:${evsMapped.attack}, B:${evsMapped.defense}, C:${evsMapped.sp_attack}, D:${evsMapped.sp_defense}, S:${evsMapped.speed}\n`;
        }
      }

      report += '\n';

    } catch (err: any) {
      console.error(`Error processing ${file}:`, err);
      report += `OCR ERROR: ${err.message || err}\n\n`;
    }
  }

  await worker.terminate();

  const statsReport = `
=== OCR ACCURACY STATISTICS ===
Total Pokemon Slots Checked: ${totalPokemonSlotsCount}
Pokemon Name Detection Rate: ${detectedPokemonCount} / ${totalPokemonSlotsCount} (${totalPokemonSlotsCount > 0 ? ((detectedPokemonCount / totalPokemonSlotsCount) * 100).toFixed(1) : 0}%)
Total Ability Slots Checked (with visible text): ${totalAbilitySlotsCount}
Ability Detection Rate: ${detectedAbilityCount} / ${totalAbilitySlotsCount} (${totalAbilitySlotsCount > 0 ? ((detectedAbilityCount / totalAbilitySlotsCount) * 100).toFixed(1) : 0}%)
Total Item Slots Checked (with visible text): ${totalItemSlotsCount}
Item Detection Rate: ${detectedItemCount} / ${totalItemSlotsCount} (${totalItemSlotsCount > 0 ? ((detectedItemCount / totalItemSlotsCount) * 100).toFixed(1) : 0}%)
================================
`;
  report += statsReport;

  fs.writeFileSync(OUTPUT_FILE, report, 'utf8');
  console.log(statsReport);
  console.log(`\nSuccessfully wrote analysis report to ${OUTPUT_FILE}`);
}

run().catch(console.error);
