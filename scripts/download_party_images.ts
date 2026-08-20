import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.join(__dirname, '../src/test/fixtures/downloaded');
const MAX_IMAGES_PER_ARTICLE = 5;
const MAX_ARTICLES = 50;

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
    // Accept standard 16:9 Switch screens (1.77) but also smartphone widescreen ratios (1.5 to 2.5)
    if (aspect >= 1.5 && aspect <= 2.5 && size.width >= 800) {
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

  let totalDownloadedCount = 0;
  let articlesWithDownloadsCount = 0;
  let page = 1;
  const visitedArticles = new Set<string>();

  while (articlesWithDownloadsCount < MAX_ARTICLES) {
    console.log(`Fetching PokeDB Champs article list page ${page}...`);
    const searchUrl = `https://champs.pokedb.tokyo/article/search?rule=0&page=${page}`;
    let html = '';
    try {
      const res = await fetch(searchUrl);
      if (!res.ok) {
        console.error(`Failed to fetch PokeDB page ${page}: ${res.status}`);
        break;
      }
      html = await res.text();
    } catch (err) {
      console.error(`Error fetching PokeDB Champs page ${page}:`, err);
      break;
    }

    // Extract external article links (e.g. hatenablog, note.com, etc.)
    const linkRegex = /href="(https:\/\/[^"]+(?:hatenablog|note\.com|hatenadiary)[^"]*)"/g;
    const articleUrls: string[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      if (!visitedArticles.has(url)) {
        articleUrls.push(url);
        visitedArticles.add(url);
      }
    }

    if (articleUrls.length === 0) {
      console.log('No new article links found. Stopping search.');
      break;
    }

    console.log(`Page ${page}: Found ${articleUrls.length} new article links. Scanning for party screenshots...`);

    for (const articleUrl of articleUrls) {
      if (articlesWithDownloadsCount >= MAX_ARTICLES) break;
      
      console.log(`Scanning article [${articlesWithDownloadsCount + 1}/${MAX_ARTICLES}]: ${articleUrl}`);
      try {
        const articleRes = await fetch(articleUrl);
        if (!articleRes.ok) continue;
        const articleHtml = await articleRes.text();
        
        // Extract all img src urls
        const imgRegex = /<img[^>]+src="([^"]+)"/g;
        const imageUrls: string[] = [];
        let imgMatch;
        while ((imgMatch = imgRegex.exec(articleHtml)) !== null) {
          try {
            const resolvedUrl = new URL(imgMatch[1], articleUrl).href;
            if (!imageUrls.includes(resolvedUrl)) {
              imageUrls.push(resolvedUrl);
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }
        
        let downloadedInArticle = 0;
        for (const imageUrl of imageUrls) {
          if (downloadedInArticle >= MAX_IMAGES_PER_ARTICLE) break;
          
          // Generate a filename
          const ext = imageUrl.endsWith('.png') ? '.png' : '.jpg';
          const filename = `party_${Date.now()}_${totalDownloadedCount}${ext}`;
          const destPath = path.join(TARGET_DIR, filename);
          
          const success = await downloadImage(imageUrl, destPath);
          if (success) {
            downloadedInArticle++;
            totalDownloadedCount++;
            // sleep a bit to avoid hammer
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (downloadedInArticle > 0) {
          articlesWithDownloadsCount++;
        }
      } catch (err) {
        console.error(`Failed to scan article ${articleUrl}:`, err);
      }
    }

    page++;
  }

  console.log(`Completed. Successfully downloaded ${totalDownloadedCount} SV party screenshots from ${articlesWithDownloadsCount} articles to ${TARGET_DIR}`);
}

main();
