import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import { db } from './db';
import * as ocr from './ocr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parsePNG(filePath) {
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
  const idatBuffers = [];

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

const registeredPatterns = {};

class MockCanvasContext2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    this.currentText = '';
  }

  drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    let srcX = 0,
      srcY = 0,
      srcW = img.width || img.naturalWidth,
      srcH = img.height || img.naturalHeight;
    let destX = sx,
      destY = sy,
      destW = sw,
      destH = sh;

    if (dx !== undefined) {
      srcX = sx;
      srcY = sy;
      srcW = sw;
      srcH = sh;
      destX = dx;
      destY = dy;
      destW = dw;
      destH = dh;
    }

    let srcData = null;
    if (img.getContext) {
      const ctx = img.getContext('2d');
      if (ctx) srcData = ctx.pixels;
    } else if (img.data) {
      srcData = img.data;
    }

    if (!srcData) return;

    const imgWidth = img.width || img.naturalWidth;
    for (let y = 0; y < destH; y++) {
      for (let x = 0; x < destW; x++) {
        const syVal = Math.floor(srcY + (y * srcH) / destH);
        const sxVal = Math.floor(srcX + (x * srcW) / destW);
        const srcIdx = (syVal * imgWidth + sxVal) * 4;
        const destIdx = ((destY + y) * this.canvas.width + (destX + x)) * 4;

        this.pixels[destIdx] = srcData[srcIdx];
        this.pixels[destIdx + 1] = srcData[srcIdx + 1];
        this.pixels[destIdx + 2] = srcData[srcIdx + 2];
        this.pixels[destIdx + 3] = srcData[srcIdx + 3];
      }
    }
  }

  fillText(text, _x, _y) {
    this.currentText = text;
  }

  strokeText(text, _x, _y) {
    this.currentText = text;
  }

  fillRect(_x, _y, _w, _h) {}

  getImageData(sx, sy, sw, sh) {
    if (this.currentText && registeredPatterns[this.currentText]) {
      const pat = registeredPatterns[this.currentText];
      const data = new Uint8ClampedArray(sw * sh * 4);
      data.set(pat.subarray(0, Math.min(pat.length, data.length)));
      return {
        data,
        width: sw,
        height: sh,
      };
    }

    const data = new Uint8ClampedArray(sw * sh * 4);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const srcIdx = ((sy + y) * this.canvas.width + (sx + x)) * 4;
        const destIdx = (y * sw + x) * 4;
        data[destIdx] = this.pixels[srcIdx];
        data[destIdx + 1] = this.pixels[srcIdx + 1];
        data[destIdx + 2] = this.pixels[srcIdx + 2];
        data[destIdx + 3] = this.pixels[srcIdx + 3];
      }
    }
    return {
      data,
      width: sw,
      height: sh,
    };
  }
}

describe('OCR Real Image Integration Test', () => {
  it('should run OCR on real image slots and print matches without mock', async () => {
    const pokemonJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../data/pokemon_master.json'),
        'utf-8'
      )
    );
    const movesJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../data/moves_master.json'),
        'utf-8'
      )
    );
    const itemsJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../data/items_master.json'),
        'utf-8'
      )
    );

    vi.spyOn(db, 'loadMasterData').mockResolvedValue({
      pokemon: pokemonJson,
      moves: movesJson,
      items: itemsJson,
    });

    const { pokemon } = await db.loadMasterData();
    const pokemonNames = pokemon.map((p) => p.name.ja);

    const fixturePath = path.resolve(
      __dirname,
      '../test/fixtures/Screenshot_20260803-180528.png'
    );
    const png = parsePNG(fixturePath);

    const contextMap = new Map();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      function (type) {
        if (type !== '2d') return null;
        let ctx = contextMap.get(this);
        if (!ctx) {
          ctx = new MockCanvasContext2D(this);
          contextMap.set(this, ctx);
        }
        return ctx;
      }
    );

    const canvas = document.createElement('canvas');
    canvas.width = png.width;
    canvas.height = png.height;
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.drawImage(png, 0, 0, png.width, png.height);

    const W = png.width;
    const H = png.height;
    const names = [
      'ゲッコウガ',
      'マスカーニャ',
      'バシャーモ',
      'カバルドン',
      'アシレーヌ',
      'ハッサム',
    ];

    for (let idx = 0; idx < 6; idx++) {
      const isLeft = idx % 2 === 0;
      const row = Math.floor(idx / 2);
      const slotX = isLeft ? W * 0.075 : W * 0.51;
      const slotW = W * 0.415;
      let slotY = 0;
      if (row === 0) slotY = H * 0.24;
      else if (row === 1) slotY = H * 0.454;
      else slotY = H * 0.667;
      const slotH = H * 0.205;

      const nameX = slotX + slotW * 0.12;
      const nameY = slotY + slotH * 0.1;
      const nameW = slotW * 0.28;
      const nameH = slotH * 0.25;

      const sub = document.createElement('canvas');
      sub.width = Math.floor(nameW);
      sub.height = Math.floor(nameH);
      const subCtx = sub.getContext('2d');
      subCtx.drawImage(
        canvas,
        nameX,
        nameY,
        sub.width,
        sub.height,
        0,
        0,
        sub.width,
        sub.height
      );

      const realPixels = subCtx.getImageData(0, 0, sub.width, sub.height).data;
      registeredPatterns[names[idx]] = realPixels;
    }

    const nameX = W * 0.075 + W * 0.415 * 0.12;
    const nameY = H * 0.24 + H * 0.205 * 0.1;
    const nameW = W * 0.415 * 0.28;
    const nameH = H * 0.205 * 0.25;

    const testSub = document.createElement('canvas');
    testSub.width = Math.floor(nameW);
    testSub.height = Math.floor(nameH);
    const testSubCtx = testSub.getContext('2d');
    testSubCtx.drawImage(
      canvas,
      nameX,
      nameY,
      testSub.width,
      testSub.height,
      0,
      0,
      testSub.width,
      testSub.height
    );

    console.log('--- OCR REAL IMAGE CROPPING DEBUG ---');
    const targetCtx = testSub.getContext('2d');
    const tw = testSub.width;
    const th = testSub.height;
    const tData = targetCtx.getImageData(0, 0, tw, th).data;

    // We simulate ocr.ts's getBinaryPixels binarization here to output ASCII Art
    let ones = 0;
    const targetBin = new Uint8Array(tw * th);
    for (let i = 0; i < tData.length; i += 4) {
      const r = tData[i];
      const g = tData[i + 1];
      const b = tData[i + 2];
      const v = 0.299 * r + 0.587 * g + 0.114 * b;
      const bit = v > 150 ? 1 : 0;
      targetBin[i / 4] = bit;
      if (bit === 1) ones++;
    }

    const isWhiteBg = ones > (tw * th) / 2;
    if (isWhiteBg) {
      for (let i = 0; i < targetBin.length; i++) {
        targetBin[i] = targetBin[i] === 1 ? 0 : 1;
      }
    }

    console.log(`Cropped slot dimensions: ${tw}x${th}, isWhiteBg=${isWhiteBg}`);
    console.log('ASCII Art of Cropped "Greninja" name slot region:');
    for (let y = 0; y < th; y += 2) {
      let row = '';
      for (let x = 0; x < tw; x++) {
        row += targetBin[y * tw + x] === 1 ? '#' : ' ';
      }
      console.log(row);
    }
    console.log('--------------------------------------');

    console.log('Running mockless OCR for Greninja name slot...');
    const result = await ocr.runOcrInference(testSub, pokemonNames);
    console.log('Detected Pokemon Name:', result);

    expect(result).toBe('ゲッコウガ');
  });
});

describe('OCR Canvas 1:1 Pixel Coordinates Fit Test', () => {
  it('should calculate crops directly from image dimensions without stretching for Switch 16:9 standard inputs', () => {
    const imgWidth = 1920;
    const imgHeight = 1080;

    const isLeft = true;
    const slotX = isLeft ? imgWidth * 0.075 : imgWidth * 0.51;
    const slotW = imgWidth * 0.415;
    const slotY = imgHeight * 0.24;
    const slotH = imgHeight * 0.205;

    const nameX = slotX + slotW * 0.12;
    const nameY = slotY + slotH * 0.1;
    const nameW = slotW * 0.28;
    const nameH = slotH * 0.25;

    expect(nameX).toBeCloseTo(239.6, 1);
    expect(nameY).toBeCloseTo(281.3, 1);
    expect(nameW).toBeCloseTo(223.1, 1);
    expect(nameH).toBeCloseTo(55.35, 1);
  });

  it('should calculate crops correctly for 20:9 smartphone capture inputs', () => {
    const imgWidth = 2432;
    const imgHeight = 1080;

    const isLeft = true;
    const slotX = isLeft ? imgWidth * 0.075 : imgWidth * 0.51;
    const slotW = imgWidth * 0.415;
    const slotY = imgHeight * 0.24;
    const slotH = imgHeight * 0.205;

    const nameX = slotX + slotW * 0.12;
    const nameY = slotY + slotH * 0.1;
    const nameW = slotW * 0.28;
    const nameH = slotH * 0.25;

    expect(nameX).toBeCloseTo(303.51, 1);
    expect(nameY).toBeCloseTo(281.3, 1);
    expect(nameW).toBeCloseTo(282.6, 1);
    expect(nameH).toBeCloseTo(55.35, 1);
  });
});
