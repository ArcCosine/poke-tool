import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../node_modules/onnxruntime-web/dist');
const destDir = path.resolve(__dirname, '../public');

const filesToCopy = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jspi.wasm',
  'ort-wasm-simd-threaded.jspi.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
  'ort-wasm-simd-threaded.asyncify.mjs'
];

async function copyWasmFiles() {
  try {
    if (!fs.existsSync(srcDir)) {
      console.error(`Source directory not found: ${srcDir}`);
      process.exit(1);
    }

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    for (const file of filesToCopy) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);

      // Check if source file exists (threaded/simd variants might differ by version)
      if (fs.existsSync(srcPath)) {
        await fs.promises.copyFile(srcPath, destPath);
        console.log(`Copied ${file} to public/`);
      } else {
        console.warn(`Source file not found (skipping): ${srcPath}`);
      }
    }
    console.log('ONNX Runtime Web WASM files setup completed.');
  } catch (error) {
    console.error('Error copying WASM files:', error);
    process.exit(1);
  }
}

copyWasmFiles();
