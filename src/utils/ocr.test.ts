import * as ort from 'onnxruntime-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectScreenType,
  findBestMatch,
  imageToTensorRec,
  initOcrModel,
  parseRadarChart,
  runOcrInference,
} from './ocr';

// Mock the automatically compiled Rust WASM bindings for test environments
vi.mock('../pkg/wasm_analysis', () => {
  return {
    default: vi.fn(),
    init_logger: vi.fn(),
    analyze_radar_chart: vi
      .fn()
      .mockReturnValue(new Uint8Array([0, 0, 0, 0, 0, 0])),
  };
});

describe('OCR and WASM loading pipelines', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize OCR session with wasm provider', async () => {
    const mockSession = { run: vi.fn() };
    const createSessionSpy = vi
      .spyOn(ort.InferenceSession, 'create')
      .mockResolvedValue(mockSession as unknown as ort.InferenceSession);

    const session = await initOcrModel('/dummy/path.onnx');
    expect(createSessionSpy).toHaveBeenCalledWith('/dummy/path.onnx', {
      executionProviders: ['wasm'],
    });
    expect(session).toBe(mockSession);
  });

  it('should run dummy inference successfully', async () => {
    const canvas = document.createElement('canvas');
    const result = await runOcrInference(canvas);
    expect(result).toBe('カイリュー');
  });

  it('should parse radar chart pixels and return 6 numbers via WASM', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const mockCtx = {
      getImageData: vi.fn().mockReturnValue({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      }),
    };
    vi.spyOn(canvas, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );

    const results = await parseRadarChart(canvas);
    expect(results.length).toBe(6);
    expect(results).toEqual([0, 0, 0, 0, 0, 0]); // Zero cyan pixels should default to 0
  });

  describe('Text Normalization and Matching', () => {
    it('should normalize and match Japanese words ignoring voiced marks and hiragana/katakana differences', () => {
      const candidates = ['カイリュー', 'ゲッコウガ', 'ピカチュウ'];

      // Hiragana vs Katakana
      expect(findBestMatch('かいりゅー', candidates)).toBe('カイリュー');
      // Voiced marks (濁点) ignored
      expect(findBestMatch('ケッコウカ', candidates)).toBe('ゲッコウガ');
      // Typo with edit distance within threshold
      expect(findBestMatch('ゲコウガ', candidates)).toBe('ゲッコウガ');
    });
  });

  describe('Image Binarization Options', () => {
    it('should binarize image pixels in imageToTensorRec if binarize option is true', () => {
      const mockPixels = new Uint8ClampedArray(10 * 10 * 4);
      for (let i = 0; i < 100; i++) {
        const val = i >= 20 && i <= 80 ? 0 : 255;
        mockPixels[i * 4] = val;
        mockPixels[i * 4 + 1] = val;
        mockPixels[i * 4 + 2] = val;
        mockPixels[i * 4 + 3] = 255;
      }

      const mockCtx = {
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        getImageData: vi.fn().mockReturnValue({
          data: mockPixels,
          width: 10,
          height: 10,
        }),
      };

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (type) => {
          if (type === '2d') return mockCtx as any;
          return null;
        }
      );

      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;

      const tensorBinarized = imageToTensorRec(canvas, 10, 10, {
        binarize: true,
      });
      const data = tensorBinarized.data as Float32Array;

      let allStrictValues = true;
      for (let i = 0; i < data.length; i++) {
        const val = data[i];
        if (Math.abs(val - 1.0) > 0.001 && Math.abs(val - -1.0) > 0.001) {
          allStrictValues = false;
        }
      }
      expect(allStrictValues).toBe(true);
    });
  });

  describe('Screen Type Detection', () => {
    it('should detect ability screen if green tab is in the left-center region', () => {
      const mockPixels = new Uint8ClampedArray(100 * 100 * 4);
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          const idx = (y * 100 + x) * 4;
          if (x >= 35 && x <= 40 && y >= 5 && y <= 10) {
            mockPixels[idx] = 100;
            mockPixels[idx + 1] = 200;
            mockPixels[idx + 2] = 120;
            mockPixels[idx + 3] = 255;
          } else {
            mockPixels[idx] = 0;
            mockPixels[idx + 1] = 0;
            mockPixels[idx + 2] = 0;
            mockPixels[idx + 3] = 255;
          }
        }
      }

      const mockCtx = {
        getImageData: vi.fn().mockReturnValue({
          data: mockPixels,
          width: 100,
          height: 100,
        }),
      };

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as any);

      const type = detectScreenType(canvas, 0, 0, 100, 100);
      expect(type).toBe('ability');
    });

    it('should detect status screen if green tab is in the right-center region', () => {
      const mockPixels = new Uint8ClampedArray(100 * 100 * 4);
      for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
          const idx = (y * 100 + x) * 4;
          if (x >= 50 && x <= 55 && y >= 5 && y <= 10) {
            mockPixels[idx] = 100;
            mockPixels[idx + 1] = 200;
            mockPixels[idx + 2] = 120;
            mockPixels[idx + 3] = 255;
          } else {
            mockPixels[idx] = 0;
            mockPixels[idx + 1] = 0;
            mockPixels[idx + 2] = 0;
            mockPixels[idx + 3] = 255;
          }
        }
      }

      const mockCtx = {
        getImageData: vi.fn().mockReturnValue({
          data: mockPixels,
          width: 100,
          height: 100,
        }),
      };

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as any);

      const type = detectScreenType(canvas, 0, 0, 100, 100);
      expect(type).toBe('status');
    });
  });
});
