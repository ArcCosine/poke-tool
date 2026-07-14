import * as ort from 'onnxruntime-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initOcrModel, runOcrInference } from './ocr';

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
});
