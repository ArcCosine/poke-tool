import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.join(__dirname, '../src/test/fixtures/downloaded');
const MAX_IMAGES = 5;

// Helper to parse PNG dimensions from binary buffer
function getPngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  if (buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

// Helper to parse JPEG dimensions from binary buffer
function getJpgSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 8) return null;
  let i = 2; // skip start marker FF D8
  while (i < buffer.length - 8) {
    const marker = buffer.readUInt16BE(i);
    i += 2;
    if (marker === 0xFFD9 || marker === 0xFFDA) {
      break; // End of image or Start of scan
    }
    const length = buffer.readUInt16BE(i);
    if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
      const height = buffer.readUInt16BE(i + 3);
      const width = buffer.readUInt16BE(i + 5);
      return { width, height };
    }
    i += length;
  }
  return null;
}

function getImageSize(buffer: Buffer): { width: number; height: number } | null {
  try {
    const pngSize = getPngSize(buffer);
    if (pngSize) return pngSize;
    const jpgSize = getJpgSize(buffer);
    if (jpgSize) return jpgSize;
  } catch (err) {
    // ignore parsing errors
  }
  return null;
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check if the image size and aspect ratio matches a party screen
    const size = getImageSize(buffer);
    if (!size) return false;
    
    const aspect = size.width / size.height;
    // SV party screens are usually 16:9 (approx 1.777)
    // Accept range between 1.7 and 1.8, and minimum width of 800px
    if (aspect >= 1.7 && aspect <= 1.8 && size.width >= 800) {
      fs.writeFileSync(destPath, buffer);
      console.log(`Downloaded: ${url} (Size: ${size.width}x${size.height}, Aspect: ${aspect.toFixed(3)})`);
      return true;
    }
  } catch (err) {
    console.error(`Failed to download image ${url}:`, err);
  }
  return false;
}

async function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  console.log('Fetching PokeDB Champs article list...');
  const searchUrl = 'https://champs.pokedb.tokyo/article/search?rule=0';
  
  try {
    const res = await fetch(searchUrl);
    if (!res.ok) {
      console.error(`Failed to fetch PokeDB page: ${res.status}`);
      return;
    }
    const html = await res.text();
    
    // Extract external article links (e.g. hatenablog, note.com, etc.)
    const linkRegex = /href="(https:\/\/[^"]+(?:hatenablog|note\.com|hatenadiary)[^"]*)"/g;
    const articleUrls: string[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      if (!articleUrls.includes(match[1])) {
        articleUrls.push(match[1]);
      }
    }
    
    console.log(`Found ${articleUrls.length} article links. Scanning for party screenshots...`);
    
    let downloadedCount = 0;
    
    for (const articleUrl of articleUrls) {
      if (downloadedCount >= MAX_IMAGES) break;
      
      console.log(`Scanning article: ${articleUrl}`);
      try {
        const articleRes = await fetch(articleUrl);
        if (!articleRes.ok) continue;
        const articleHtml = await articleRes.text();
        
        // Extract all img src urls
        const imgRegex = /<img[^>]+src="([^"]+)"/g;
        const imageUrls: string[] = [];
        let imgMatch;
        while ((imgMatch = imgRegex.exec(articleHtml)) !== null) {
          let url = imgMatch[1];
          // Handle relative urls
          if (url.startsWith('//')) {
            url = 'https:' + url;
          } else if (url.startsWith('/')) {
            const parsedUrl = new URL(articleUrl);
            url = parsedUrl.origin + url;
          }
          if (!imageUrls.includes(url)) {
            imageUrls.push(url);
          }
        }
        
        for (const imageUrl of imageUrls) {
          if (downloadedCount >= MAX_IMAGES) break;
          
          // Generate a filename
          const ext = imageUrl.endsWith('.png') ? '.png' : '.jpg';
          const filename = `party_${Date.now()}_${downloadedCount}${ext}`;
          const destPath = path.join(TARGET_DIR, filename);
          
          const success = await downloadImage(imageUrl, destPath);
          if (success) {
            downloadedCount++;
            // sleep a bit to avoid hammer
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (err) {
        console.error(`Failed to scan article ${articleUrl}:`, err);
      }
    }
    
    console.log(`Completed. Successfully downloaded ${downloadedCount} SV party screenshots to ${TARGET_DIR}`);
  } catch (err) {
    console.error('Error fetching PokeDB Champs:', err);
  }
}

main();
