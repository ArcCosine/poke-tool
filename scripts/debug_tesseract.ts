import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const filePath = path.resolve(__dirname, '../src/test/fixtures/Screenshot_20260803-180528.png');
  console.log('Loading image:', filePath);
  const imageBuffer = fs.readFileSync(filePath);

  console.log('Creating worker...');
  const worker = await Tesseract.createWorker('jpn+eng', 1, {
    langPath: path.resolve(__dirname, '../tessdata'),
  });

  console.log('Running recognize...');
  const result = await worker.recognize(imageBuffer);
  console.log('Result properties:', Object.keys(result));
  console.log('Result data keys:', Object.keys(result.data));
  console.log('Result text length:', result.data.text ? result.data.text.length : 0);
  
  if (result.data.blocks) {
    console.log('Blocks count:', result.data.blocks.length);
    const firstBlock = result.data.blocks[0];
    if (firstBlock) {
      console.log('First block keys:', Object.keys(firstBlock));
      if (firstBlock.paragraphs) {
        console.log('  Paragraphs count:', firstBlock.paragraphs.length);
        const firstPara = firstBlock.paragraphs[0];
        if (firstPara && firstPara.lines) {
          console.log('    Lines count:', firstPara.lines.length);
          const firstLine = firstPara.lines[0];
          if (firstLine) {
            console.log('    First line keys:', Object.keys(firstLine));
            console.log('    First line text:', JSON.stringify(firstLine.text));
            console.log('    First line bbox:', firstLine.bbox);
            if (firstLine.words) {
              console.log('      Words inside line count:', firstLine.words.length);
            }
          }
        }
      }
    }
  }

  await worker.terminate();
}

run().catch(console.error);
