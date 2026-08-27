import * as ort from 'onnxruntime-web';

// Point to the public/ directory where WASM files are copied by copy-wasm.js
ort.env.wasm.wasmPaths = self.location.origin + '/';
ort.env.wasm.numThreads = 1;

let detSession: ort.InferenceSession | null = null;
let parseqSession: ort.InferenceSession | null = null;
let charList: string[] = [];
let isInitialized = false;

// IndexedDB Caching for Model Buffers
function initModelDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OCRModelDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('models')) {
        db.createObjectStore('models');
      }
    };
  });
}

function getCachedModel(name: string): Promise<ArrayBuffer | null> {
  return new Promise<ArrayBuffer | null>((resolve) => {
    initModelDB().then(db => {
      const tx = db.transaction('models', 'readonly');
      const store = tx.objectStore('models');
      const req = store.get(name);
      req.onerror = () => resolve(null);
      req.onsuccess = () => resolve((req.result as ArrayBuffer) || null);
    }).catch(() => resolve(null));
  });
}

function cacheModel(name: string, buffer: ArrayBuffer): Promise<void> {
  return new Promise<void>((resolve) => {
    initModelDB().then(db => {
      const tx = db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      const req = store.put(buffer, name);
      req.onerror = () => resolve();
      req.onsuccess = () => resolve();
    }).catch(err => {
      console.warn('Failed to cache model to IndexedDB:', err);
      resolve();
    });
  });
}

async function getModelBuffer(url: string, name: string): Promise<ArrayBuffer> {
  const cached = await getCachedModel(name);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch model ${name} from ${url}`);
  }
  const buffer = await response.arrayBuffer();
  await cacheModel(name, buffer);
  return buffer;
}

// Initialization function
async function initializeOCR() {
  if (isInitialized) return;

  try {
    self.postMessage({ type: 'status', message: 'loading_models' });

    // Load charlist JSON
    const charListRes = await fetch('/models/NDLmoji.json');
    if (!charListRes.ok) {
      throw new Error('Failed to load NDLmoji.json');
    }
    charList = await charListRes.json();

    // Fetch and load ONNX models (using buffers for IndexedDB cache support)
    const detBuffer = await getModelBuffer('/models/det.onnx', 'det.onnx');
    const parseqBuffer = await getModelBuffer('/models/parseq-ndl-30.onnx', 'parseq-ndl-30.onnx');

    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    };

    detSession = await ort.InferenceSession.create(detBuffer, options);
    parseqSession = await ort.InferenceSession.create(parseqBuffer, options);

    isInitialized = true;
    self.postMessage({ type: 'status', message: 'ready' });
  } catch (error: any) {
    console.error('OCR Worker initialization error:', error);
    self.postMessage({ type: 'status', message: 'error', error: error.message });
  }
}

// Connected Component Labeling & Breadth-First Search for DBNet output maps
function getBoundingBoxes(
  predMap: Float32Array,
  width: number,
  height: number,
  thresh = 0.3,
  minSize = 15
): { x: number; y: number; w: number; h: number; score: number }[] {
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < predMap.length; i++) {
    binary[i] = predMap[i] >= thresh ? 1 : 0;
  }

  const visited = new Uint8Array(width * height);
  const boxes: { x: number; y: number; w: number; h: number; score: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] === 1 && visited[idx] === 0) {
        const queue: [number, number][] = [[x, y]];
        visited[idx] = 1;

        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let sumScore = 0;
        let count = 0;

        let qHead = 0;
        while (qHead < queue.length) {
          const [cx, cy] = queue[qHead++];
          const cidx = cy * width + cx;
          sumScore += predMap[cidx];
          count++;

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-connectivity
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nidx = ny * width + nx;
              if (binary[nidx] === 1 && visited[nidx] === 0) {
                visited[nidx] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }

        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        const score = sumScore / count;

        // Apply size threshold
        if (w >= 6 && h >= 6 && w * h >= minSize && score >= 0.5) {
          boxes.push({ x: minX, y: minY, w, h, score });
        }
      }
    }
  }

  return boxes;
}

// Worker message routing
self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data;

  if (type === 'init') {
    await initializeOCR();
    return;
  }

  if (type === 'analyze') {
    if (!isInitialized) {
      await initializeOCR();
    }
    if (!detSession || !parseqSession) {
      self.postMessage({ type: 'result', error: 'Models are not initialized.' });
      return;
    }

    const { bitmap }: { bitmap: ImageBitmap } = e.data;
    try {
      const origW = bitmap.width;
      const origH = bitmap.height;

      // 1. Calculate aspect-ratio preserved dimensions scaled to max side 1600 (divisible by 32)
      // Scaling up smaller images helps the detector find tiny numeric text fields.
      const maxSide = 1600;
      let scale = 1.0;
      if (Math.max(origW, origH) !== maxSide) {
        scale = maxSide / Math.max(origW, origH);
      }
      const targetW = Math.round((origW * scale) / 32) * 32 || 32;
      const targetH = Math.round((origH * scale) / 32) * 32 || 32;

      // 2. Preprocess image using OffscreenCanvas
      const canvas = new OffscreenCanvas(targetW, targetH);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imgData.data;

      // Create NCHW Float32 input tensor with ImageNet normalization
      const inputBuffer = new Float32Array(1 * 3 * targetH * targetW);
      const mean = [0.485, 0.456, 0.406];
      const std = [0.229, 0.224, 0.225];

      for (let h = 0; h < targetH; h++) {
        for (let w = 0; w < targetW; w++) {
          const pixelOffset = (h * targetW + w) * 4;
          for (let c = 0; c < 3; c++) {
            const val = data[pixelOffset + c] / 255.0;
            const tensorIdx = c * targetH * targetW + h * targetW + w;
            inputBuffer[tensorIdx] = (val - mean[c]) / std[c];
          }
        }
      }

      // 3. Run Text Detection
      const detInputTensor = new ort.Tensor('float32', inputBuffer, [1, 3, targetH, targetW]);
      const detFeeds = { x: detInputTensor };
      const detOutputs = await detSession.run(detFeeds);
      const detOutputMap = detOutputs[detSession.outputNames[0]].data as Float32Array;

      // 4. Extract Bounding Boxes
      const boxes = getBoundingBoxes(detOutputMap, targetW, targetH, 0.3, 15);

      const ocrResults: { text: string; x: number; y: number; w: number; h: number }[] = [];

      // 5. Crop and Recognize Text on each bounding box
      for (const box of boxes) {
        // Map bounding box coordinates back to original image scale
        const origX = Math.round(box.x / scale);
        const origY = Math.round(box.y / scale);
        const origBoxW = Math.round(box.w / scale);
        const origBoxH = Math.round(box.h / scale);

        // Crop bounding box and resize to PARSeq input height 16px and width 256px
        // (using PARSeq-30 model size: [1, 3, 16, 256])
        const cropW = 256;
        const cropH = 16;
        const cropCanvas = new OffscreenCanvas(cropW, cropH);
        const cropCtx = cropCanvas.getContext('2d')!;

        // Draw cropped area into cropCanvas (resizing it)
        cropCtx.drawImage(
          bitmap,
          origX,
          origY,
          origBoxW,
          origBoxH,
          0,
          0,
          cropW,
          cropH
        );

        const cropImgData = cropCtx.getImageData(0, 0, cropW, cropH);
        const cropData = cropImgData.data;

        // Create PARSeq NCHW input tensor with mean=0.5, std=0.5 normalization (mapping to [-1, 1])
        const recInputBuffer = new Float32Array(1 * 3 * cropH * cropW);
        for (let h = 0; h < cropH; h++) {
          for (let w = 0; w < cropW; w++) {
            const pixelOffset = (h * cropW + w) * 4;
            for (let c = 0; c < 3; c++) {
              const val = cropData[pixelOffset + c] / 255.0;
              const tensorIdx = c * cropH * cropW + h * cropW + w;
              recInputBuffer[tensorIdx] = 2.0 * (val - 0.5);
            }
          }
        }

        // Run Text Recognition
        const recInputTensor = new ort.Tensor('float32', recInputBuffer, [1, 3, cropH, cropW]);
        const recFeeds = { images: recInputTensor };
        const recOutputs = await parseqSession.run(recFeeds);
        const recLogits = recOutputs[parseqSession.outputNames[0]].data as Float32Array;

        const [, seqLen, vocabSize] = recOutputs[parseqSession.outputNames[0]].dims;

        const decodedChars: string[] = [];
        for (let s = 0; s < seqLen; s++) {
          let maxVal = -Number.MAX_VALUE;
          let maxIdx = -1;
          for (let v = 0; v < vocabSize; v++) {
            const val = recLogits[s * vocabSize + v];
            if (val > maxVal) {
              maxVal = val;
              maxIdx = v;
            }
          }

          if (maxIdx === 0) break; // <eos> token

          const classId = maxIdx - 1;
          if (classId >= 0 && classId < charList.length) {
            decodedChars.push(charList[classId]);
          }
        }

        const recognizedText = decodedChars.join('').trim();
        if (recognizedText.length > 0) {
          ocrResults.push({
            text: recognizedText,
            x: origX,
            y: origY,
            w: origBoxW,
            h: origBoxH,
          });
        }
      }

      // Close the bitmap to free graphics memory
      bitmap.close();

      self.postMessage({
        type: 'result',
        results: ocrResults,
      });
    } catch (error: any) {
      console.error('OCR Worker run error:', error);
      bitmap.close();
      self.postMessage({ type: 'result', error: error.message });
    }
  }
};
