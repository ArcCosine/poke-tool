import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../src/data');
const FIXTURES_DIR = path.resolve(__dirname, '../src/test/fixtures');
const OUTPUT_FILE = path.resolve(__dirname, '../ocr_fixture_results.txt');

interface PokemonMaster {
  id: number;
  name: { ja: string; en: string };
  abilities: { ja: string; en: string }[];
  learnable_moves: number[];
}

interface MoveMaster {
  id: number;
  name: { ja: string; en: string };
}

interface ItemMaster {
  id: number;
  name: { ja: string; en: string };
}

// Levenshtein distance
function getEditDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function findBestMatch(
  text: string,
  candidates: string[],
  maxDistanceThreshold = 2
): string | null {
  if (!text) return null;
  if (candidates.includes(text)) {
    return text;
  }
  let bestMatch: string | null = null;
  let minDistance = Infinity;
  for (const candidate of candidates) {
    const dist = getEditDistance(text, candidate);
    if (dist < minDistance && dist <= maxDistanceThreshold) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }
  return bestMatch;
}

async function run() {
  console.log('Loading database JSON files...');
  let pokemonList: PokemonMaster[] = [];
  let movesList: MoveMaster[] = [];
  let itemsList: ItemMaster[] = [];

  try {
    pokemonList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pokemon_master.json'), 'utf8'));
    movesList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'moves_master.json'), 'utf8'));
    itemsList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'items_master.json'), 'utf8'));
  } catch (e) {
    console.warn('Could not load original database JSONs, using mock definitions.', e);
    // fallback to minimal mock if files not found
  }

  const allPokemonNames = pokemonList.flatMap((p) => [p.name.ja, p.name.en].filter(Boolean));
  const allItemNames = itemsList.flatMap((i) => [i.name.ja, i.name.en].filter(Boolean));

  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
  console.log(`Found ${files.length} fixture files to analyze.`);

  let report = '=== OCR TEXT EXTRACTION REPORT FOR FIXTURES ===\n\n';

  // We reuse the worker to speed up and avoid multiple initialization warnings
  console.log('Initializing Tesseract worker...');
  const worker = await Tesseract.createWorker('jpn+eng', 1);

  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    console.log(`Processing: ${file}...`);
    report += `=========================================\n`;
    report += `FILE: ${file}\n`;
    report += `=========================================\n`;

    try {
      // Determine image dimensions
      // Using a quick dynamic size detection would be ideal, but for Node we can parse metadata or assume defaults.
      // In web app, we read from naturalWidth. Let's assume standard 1200x675 or 1920x1080.
      // Let's read the image using a simple buffer or assume 1920x1080 if not specified.
      // Alternatively, we can use the Tesseract result.data.image or similar if available, or just mock it.
      // Let's assume 1920x1080 as standard layout base for coordinate mapping.
      const imgWidth = 1920;
      const imgHeight = 1080;

      const imageBuffer = fs.readFileSync(filePath);
      const result = await worker.recognize(imageBuffer);
      const words = (result.data.words || []).map((w) => {
        const { x0, y0, x1, y1 } = w.bbox;
        return {
          text: w.text.trim(),
          x: x0,
          y: y0,
          w: x1 - x0,
          h: y1 - y0,
        };
      });

      report += `[RAW WORDS DETECTED: ${words.length}]\n`;
      report += words.map((w) => `"${w.text}" (x:${w.x}, y:${w.y}, w:${w.w}, h:${w.h})`).join(', ') + '\n\n';

      // 1. Identify Screen Type
      let detectedScreenType: 'ability' | 'status' = 'ability';
      const hasEvIndicator = words.some((w) =>
        /^(HP|HP|H|A|B|C|D|S)$/i.test(w.text) ||
        /^\+[0-3]?[0-2]$/.test(w.text)
      );
      if (hasEvIndicator) {
        detectedScreenType = 'status';
      }
      // Also check filename as hint
      if (file.toLowerCase().includes('status')) {
        detectedScreenType = 'status';
      } else if (file.toLowerCase().includes('ability')) {
        detectedScreenType = 'ability';
      }

      report += `DETECTED SCREEN TYPE: ${detectedScreenType.toUpperCase()}\n\n`;

      // 2. Partition words into 6 slots
      const slotWords: typeof words[] = Array.from({ length: 6 }, () => []);
      for (const word of words) {
        const cx = word.x + word.w / 2;
        const cy = word.y + word.h / 2;
        // In real images, coordinates are relative to the actual image size.
        // Tesseract returns coordinates relative to the actual file size.
        // Let's calculate relative coords:
        // We need to know actual image size to partition correctly.
        // Tesseract's result has width/height.
        const actualWidth = (result.data as any).width || imgWidth;
        const actualHeight = (result.data as any).height || imgHeight;

        const isLeft = cx < actualWidth * 0.5;
        let row = 0;
        if (cy < actualHeight * 0.45) {
          row = 0;
        } else if (cy < actualHeight * 0.66) {
          row = 1;
        } else {
          row = 2;
        }
        const slotIdx = (isLeft ? 0 : 1) + row * 2;
        slotWords[slotIdx].push(word);
      }

      // 3. Resolve details for each slot
      for (let slotIdx = 0; slotIdx < 6; slotIdx++) {
        const sWords = slotWords[slotIdx];
        report += `---- SLOT ${slotIdx + 1} ----\n`;
        if (sWords.length === 0) {
          report += `  (No words classified in this slot area)\n`;
          continue;
        }

        report += `  Slot Raw Words: ` + sWords.map((w) => `"${w.text}"`).join(', ') + '\n';

        let matchedPokemon: PokemonMaster | null = null;
        let nameWord: typeof words[0] | null = null;

        for (const word of sWords) {
          const bestMatchName = findBestMatch(word.text, allPokemonNames, 2);
          if (bestMatchName) {
            const p = pokemonList.find(
              (p) => p.name.ja === bestMatchName || p.name.en === bestMatchName
            );
            if (p && word.text.length >= 2) {
              matchedPokemon = p;
              nameWord = word;
              break;
            }
          }
        }

        if (!matchedPokemon || !nameWord) {
          report += `  => POKEMON NAME NOT DETECTED (or failed to match DB)\n`;
          continue;
        }

        report += `  => DETECTED POKEMON: ${matchedPokemon.name.ja} (${matchedPokemon.name.en})\n`;

        let ability = '';
        let item = '';
        const moves: string[] = [];
        const evsMapped = {
          hp: 0,
          attack: 0,
          defense: 0,
          speed: 0,
          sp_defense: 0,
          sp_attack: 0,
        };

        const otherWords = sWords.filter((w) => w !== nameWord);

        if (detectedScreenType === 'ability') {
          const abilityCandidates = matchedPokemon.abilities.flatMap((a) => [a.ja, a.en].filter(Boolean));
          for (const word of otherWords) {
            const bestAb = findBestMatch(word.text, abilityCandidates, 2);
            if (bestAb) {
              const matchedAbilityObj = matchedPokemon.abilities.find(
                (a) => a.ja === bestAb || a.en === bestAb
              );
              if (matchedAbilityObj) {
                ability = matchedAbilityObj.ja;
                break;
              }
            }
          }

          for (const word of otherWords) {
            const bestItem = findBestMatch(word.text, allItemNames, 2);
            if (bestItem) {
              const matchedItemObj = itemsList.find(
                (i) => i.name.ja === bestItem || i.name.en === bestItem
              );
              if (matchedItemObj) {
                item = matchedItemObj.name.ja;
                break;
              }
            }
          }

          const learnableMoveNames = movesList
            .filter((m) => matchedPokemon!.learnable_moves.includes(m.id))
            .flatMap((m) => [m.name.ja, m.name.en].filter(Boolean));

          for (const word of otherWords) {
            const bestMove = findBestMatch(word.text, learnableMoveNames, 2);
            if (bestMove) {
              const matchedMoveObj = movesList.find(
                (m) => m.name.ja === bestMove || m.name.en === bestMove
              );
              if (matchedMoveObj && !moves.includes(matchedMoveObj.name.ja)) {
                moves.push(matchedMoveObj.name.ja);
              }
            }
          }

          report += `     Ability: ${ability || '(Not detected)'}\n`;
          report += `     Item: ${item || '(Not detected)'}\n`;
          report += `     Moves: ${moves.join(', ') || '(None detected)'}\n`;
        } else {
          // EVs
          const evNumMatches: { val: number; y: number; x: number; text: string }[] = [];
          for (const word of otherWords) {
            const m = word.text.match(/^\+?([0-9]+)$/);
            if (m) {
              const val = parseInt(m[1], 10);
              if (val >= 0 && val <= 252) {
                evNumMatches.push({ val, y: word.y, x: word.x, text: word.text });
              }
            }
          }

          const rows: typeof evNumMatches[] = [];
          for (const match of evNumMatches) {
            let added = false;
            for (const row of rows) {
              if (Math.abs(row[0].y - match.y) < 15) {
                row.push(match);
                added = true;
                break;
              }
            }
            if (!added) {
              rows.push([match]);
            }
          }

          rows.sort((a, b) => a[0].y - b[0].y);

          const evKeys: (keyof typeof evsMapped)[] = [
            'hp',
            'attack',
            'defense',
            'sp_attack',
            'sp_defense',
            'speed',
          ];

          for (let i = 0; i < Math.min(6, rows.length); i++) {
            const row = rows[i];
            let bestMatch = row[0];
            for (const m of row) {
              if (m.text.startsWith('+')) {
                bestMatch = m;
                break;
              }
              if (m.x > bestMatch.x) {
                bestMatch = m;
              }
            }
            evsMapped[evKeys[i]] = bestMatch.val;
          }

          report += `     EVs => H:${evsMapped.hp}, A:${evsMapped.attack}, B:${evsMapped.defense}, C:${evsMapped.sp_attack}, D:${evsMapped.sp_defense}, S:${evsMapped.speed}\n`;
        }
      }

      report += '\n';

    } catch (err: any) {
      console.error(`Error processing ${file}:`, err);
      report += `OCR ERROR: ${err.message || err}\n\n`;
    }
  }

  await worker.terminate();

  fs.writeFileSync(OUTPUT_FILE, report, 'utf8');
  console.log(`\nSuccessfully wrote analysis report to ${OUTPUT_FILE}`);
}

run().catch(console.error);
