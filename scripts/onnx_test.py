import cv2
from onnxocr.onnx_paddleocr import ONNXPaddleOcr

img = cv2.imread("../src/test/fixtures/20260805170752.jpg")
model = ONNXPaddleOcr(use_angle_cls=False, use_gpu=False)
result = model.ocr(img)

for line in result[0]:
    text, score = line[1]
    print(text, score)
