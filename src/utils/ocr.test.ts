import * as ort from 'onnxruntime-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initOcrModel, parseRadarChart, runOcrInference } from './ocr';

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
});
