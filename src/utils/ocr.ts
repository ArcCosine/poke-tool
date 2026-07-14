import * as ort from 'onnxruntime-web';

// Keep a reference to the dynamically loaded WASM module
let wasmModule: typeof import('../pkg/wasm_analysis') | null = null;

export async function initWasm() {
  if (wasmModule) return wasmModule;
  try {
    // Dynamic import to handle asynchronous loading via vite-plugin-wasm
    const mod = await import('../pkg/wasm_analysis');
    mod.init_logger();
    wasmModule = mod;
    return wasmModule;
  } catch (err) {
    console.error('Failed to load WASM module:', err);
    throw err;
  }
}

// ONNX Inference Session holder
let ocrSession: ort.InferenceSession | null = null;

export async function initOcrModel(modelPath = '/models/ocr_model.onnx') {
  if (ocrSession) return ocrSession;
  try {
    // Configure ONNX Runtime to use WASM backend for local execution
    ort.env.wasm.numThreads = 1;
    ocrSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['wasm'],
    });
    console.log('ONNX OCR Model initialized successfully.');
    return ocrSession;
  } catch (err) {
    console.error('Failed to initialize ONNX OCR model:', err);
    throw err;
  }
}

// Dummy OCR runner (returns mock recognized text for verification)
export async function runOcrInference(
  _canvas: HTMLCanvasElement
): Promise<string> {
  // Try initializing session
  await initOcrModel().catch(() => {});
  return 'カイリュー'; // Mock recognized text
}

// Effort values parser using Rust WASM
export async function parseRadarChart(
  canvas: HTMLCanvasElement
): Promise<number[]> {
  const wasm = await initWasm();
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Pass pixel array directly to Rust WASM
  const results = wasm.analyze_radar_chart(
    imgData.data,
    canvas.width,
    canvas.height
  );

  return Array.from(results);
}
