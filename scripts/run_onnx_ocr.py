import os
import cv2
import sys
from onnxocr.onnx_paddleocr import ONNXPaddleOcr

def main():
    # Determine directories relative to script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    fixtures_dir = os.path.join(project_root, "src", "test", "fixtures")
    output_path = os.path.join(project_root, "onnx_ocr_fixtures_output.txt")
    
    if not os.path.exists(fixtures_dir):
        print(f"Error: Fixtures directory not found at {fixtures_dir}")
        sys.exit(1)
        
    print("Loading Default ONNXPaddleOcr...")
    # Default OCR engine (for Japanese / English)
    model_default = ONNXPaddleOcr(use_angle_cls=True, use_gpu=False)
    
    # Load Korean model
    korean_model_dir = os.path.join(script_dir, "ocr_models", "korean", "rec.onnx")
    korean_dict_path = os.path.join(script_dir, "ocr_models", "korean", "dict.txt")
    
    print("Loading Korean ONNXPaddleOcr...")
    model_korean = ONNXPaddleOcr(
        use_angle_cls=True, 
        use_gpu=False,
        rec_model_dir=korean_model_dir,
        rec_char_dict_path=korean_dict_path
    )
    
    # List and sort image files
    valid_extensions = ('.png', '.jpg', '.jpeg', '.bmp')
    files = sorted([f for f in os.listdir(fixtures_dir) if f.lower().endswith(valid_extensions)])
    
    print(f"Found {len(files)} images to process.")
    
    with open(output_path, "w", encoding="utf-8") as out:
        out.write("=== OnnxOCR Text Extraction Report for Fixtures ===\n\n")
        
        for idx, file in enumerate(files):
            file_path = os.path.join(fixtures_dir, file)
            print(f"Processing ({idx+1}/{len(files)}): {file}")
            
            out.write("=========================================\n")
            out.write(f"FILE: {file}\n")
            out.write("=========================================\n")
            
            # Select engine based on file name
            # 2.jpg and 3.jpg contain Korean text.
            if file.lower() in ("2.jpg", "3.jpg"):
                print(f"Using Korean OCR model for {file}...")
                model = model_korean
                out.write("[USING KOREAN OCR MODEL]\n")
            else:
                model = model_default
                out.write("[USING DEFAULT OCR MODEL]\n")
                
            try:
                img = cv2.imread(file_path)
                if img is None:
                    out.write("ERROR: Failed to read image.\n\n")
                    continue
                
                result = model.ocr(img)
                
                if not result or not result[0]:
                    out.write("(No text detected)\n\n")
                    continue
                
                out.write(f"[RAW WORDS DETECTED: {len(result[0])}]\n")
                for line in result[0]:
                    box = line[0]  # [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
                    text, score = line[1]
                    
                    # Format coordinate boxes as points
                    box_str = ", ".join([f"[{int(pt[0])},{int(pt[1])}]" for pt in box])
                    out.write(f'"{text}" (score: {score:.4f}) | Box: [{box_str}]\n')
                    
                out.write("\n")
            except Exception as e:
                out.write(f"ERROR: {str(e)}\n\n")
                print(f"Error processing {file}: {e}")
                
    print(f"Done. Report written to {output_path}")

if __name__ == "__main__":
    main()
