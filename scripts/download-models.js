import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.resolve(__dirname, '../public/models');

const models = [
  {
    name: 'det.onnx',
    url: 'https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_server_infer.onnx'
  },
  {
    name: 'parseq-ndl-30.onnx',
    url: 'https://pub-9cac8877191a4c3697edb59fd982130f.r2.dev/parseq-ndl-30.onnx'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirect
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    for (const model of models) {
      const destPath = path.join(modelsDir, model.name);
      if (fs.existsSync(destPath)) {
        console.log(`${model.name} already exists. Skipping.`);
        continue;
      }
      console.log(`Downloading ${model.name}...`);
      try {
        await downloadFile(model.url, destPath);
        console.log(`Successfully downloaded ${model.name}`);
      } catch (error) {
        console.error(`Error downloading ${model.name}:`, error);
        // Clean up partially downloaded file
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
      }
    }

    // Download and convert NDLmoji.yaml to JSON
    const yamlPath = path.join(modelsDir, 'NDLmoji.yaml');
    const jsonPath = path.join(modelsDir, 'NDLmoji.json');
    if (!fs.existsSync(jsonPath)) {
      console.log('Downloading and parsing NDLmoji.yaml...');
      const yamlUrl = 'https://raw.githubusercontent.com/yuta1984/ndlkotenocr-lite-web/master/config/NDLmoji.yaml';
      try {
        await downloadFile(yamlUrl, yamlPath);
        console.log('Successfully downloaded NDLmoji.yaml. Parsing to JSON...');
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        
        // Extract charset_test value
        const match = yamlContent.match(/charset_test:\s*"((?:[^"\\]|\\.)*)"/);
        if (match) {
          let rawStr = match[1];
          // Unescape backslash quotes
          rawStr = rawStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          const charList = rawStr.split('');
          fs.writeFileSync(jsonPath, JSON.stringify(charList, null, 2), 'utf8');
          console.log(`Successfully generated NDLmoji.json with ${charList.length} characters.`);
        } else {
          console.error('Failed to parse charset_test from NDLmoji.yaml');
        }
        
        // Clean up temporary YAML file
        if (fs.existsSync(yamlPath)) {
          fs.unlinkSync(yamlPath);
        }
      } catch (error) {
        console.error('Error handling NDLmoji.yaml:', error);
      }
    } else {
      console.log('NDLmoji.json already exists. Skipping.');
    }

    console.log('Model setup completed.');
  } catch (error) {
    console.error('Model setup script error:', error);
  }
}

main();
