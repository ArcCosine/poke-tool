import { db } from './db';
import { fuzzyMatchPokemonData } from './ocrFuzzy';
import type { RawOCRData, ProcessedOCRData } from './ocrFuzzy';

let ocrWorker: Worker | null = null;
let workerStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
let initPromise: Promise<void> | null = null;

export function getOCRWorkerStatus(): 'idle' | 'loading' | 'ready' | 'error' {
  return workerStatus;
}

// Initialize the worker and load models
export function initOCRWorker(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined') {
        return resolve(); // SSR safety
      }

      workerStatus = 'loading';
      
      // Instantiate worker using Vite's URL constructor pattern
      ocrWorker = new Worker(
        new URL('./ocr.worker.ts', import.meta.url),
        { type: 'module' }
      );

      ocrWorker.postMessage({ type: 'init' });

      ocrWorker.onmessage = (e) => {
        const { type, message, error } = e.data;
        if (type === 'status') {
          if (message === 'ready') {
            workerStatus = 'ready';
            resolve();
          } else if (message === 'error') {
            workerStatus = 'error';
            reject(new Error(error));
          }
        }
      };

      ocrWorker.onerror = (err) => {
        workerStatus = 'error';
        reject(err);
      };
    } catch (err) {
      workerStatus = 'error';
      reject(err);
    }
  });

  return initPromise;
}

interface RawOcrResultItem {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Extracts and maps raw layout boxes into structured Pokemon fields,
 * sorting stat values vertically and utilizing fuzzy dictionary mappings.
 */
export interface OcrAnalysisResponse {
  results: RawOcrResultItem[];
  width: number;
  height: number;
}

export interface CustomSlotZone {
  id: number;
  x: number; // 0 to 1 (percentage of width)
  y: number; // 0 to 1 (percentage of height)
  w: number; // 0 to 1
  h: number; // 0 to 1
}

/**
 * Extracts and maps raw layout boxes into structured Pokemon fields by automatically
 * detecting the grid layout (columns and rows) or using custom user-defined bounding zones.
 */
export async function processOcrResults(
  results: RawOcrResultItem[],
  imgWidth = 0,
  imgHeight = 0,
  customZones?: CustomSlotZone[]
): Promise<ProcessedOCRData[]> {
  // 1. Load master data from IndexedDB/JSON
  const master = await db.loadMasterData();

  const pokemonList = master.pokemon.map(p => p.name.ja);
  const itemList = master.items.map(i => i.name.ja);
  const moveList = master.moves.map(m => m.name.ja);
  
  // Extract all unique Japanese abilities
  const abilitySet = new Set<string>();
  for (const p of master.pokemon) {
    for (const ab of p.abilities) {
      if (ab.ja) abilitySet.add(ab.ja);
    }
  }
  const abilityList = Array.from(abilitySet);

  // 2. Determine slot distribution method
  const isCustom = customZones && customZones.length > 0;
  let cols = 2;
  let rows = 3;

  if (!isCustom && imgWidth > 0 && imgHeight > 0) {
    const anchors: RawOcrResultItem[] = [];
    for (const item of results) {
      const text = item.text.trim();
      if (text.length < 2) continue;
      for (const pName of pokemonList) {
        const limit = pName.length <= 2 ? 1 : 2;
        if (levenshtein(text, pName) <= limit) {
          anchors.push(item);
          break;
        }
      }
    }

    if (anchors.length >= 2) {
      // Find distinct X coordinate groups to estimate columns
      const xCoords = anchors.map(a => a.x + a.w / 2).sort((a, b) => a - b);
      const xGroups: number[][] = [[xCoords[0]]];
      for (let i = 1; i < xCoords.length; i++) {
        const lastGroup = xGroups[xGroups.length - 1];
        const lastVal = lastGroup[lastGroup.length - 1];
        if (xCoords[i] - lastVal > imgWidth * 0.12) {
          xGroups.push([xCoords[i]]);
        } else {
          lastGroup.push(xCoords[i]);
        }
      }
      
      // Find distinct Y coordinate groups to estimate rows
      const yCoords = anchors.map(a => a.y + a.h / 2).sort((a, b) => a - b);
      const yGroups: number[][] = [[yCoords[0]]];
      for (let i = 1; i < yCoords.length; i++) {
        const lastGroup = yGroups[yGroups.length - 1];
        const lastVal = lastGroup[lastGroup.length - 1];
        if (yCoords[i] - lastVal > imgHeight * 0.12) {
          yGroups.push([yCoords[i]]);
        } else {
          lastGroup.push(yCoords[i]);
        }
      }

      cols = xGroups.length;
      rows = yGroups.length;

      // Fallback check: if estimation gives single slot, force standard 2x3
      if (cols * rows < 2) {
        cols = 2;
        rows = 3;
      }
    }
  }

  // Group results into slots based on grid coordinates or custom zones
  const slotCount = isCustom ? customZones.length : cols * rows;
  const slots: RawOcrResultItem[][] = Array.from({ length: slotCount }, () => []);

  const colWidth = imgWidth > 0 ? imgWidth / cols : 0;
  const rowHeight = imgHeight > 0 ? imgHeight / rows : 0;

  for (const item of results) {
    if (isCustom && imgWidth > 0 && imgHeight > 0) {
      // Normalize item centers
      const rx = (item.x + item.w / 2) / imgWidth;
      const ry = (item.y + item.h / 2) / imgHeight;

      // Find which zone contains this text item center
      let matchedIdx = -1;
      for (const zone of customZones) {
        if (rx >= zone.x && rx <= zone.x + zone.w && ry >= zone.y && ry <= zone.y + zone.h) {
          matchedIdx = zone.id;
          break;
        }
      }
      if (matchedIdx >= 0 && matchedIdx < slotCount) {
        slots[matchedIdx].push(item);
      }
    } else if (colWidth > 0 && rowHeight > 0) {
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      const colIdx = Math.min(Math.floor(cx / colWidth), cols - 1);
      const rowIdx = Math.min(Math.floor(cy / rowHeight), rows - 1);
      const slotIdx = rowIdx * cols + colIdx;
      slots[slotIdx].push(item);
    } else {
      slots[0].push(item);
    }
  }

  const processedList: ProcessedOCRData[] = [];

  for (let s = 0; s < slotCount; s++) {
    const slotResults = slots[s];
    if (slotResults.length === 0) {
      processedList.push({
        pokemonName: '認識できませんでした',
        ability: '認識できませんでした',
        item: '認識できませんでした',
        moves: ['認識できませんでした', '認識できませんでした', '認識できませんでした', '認識できませんでした'],
        stats: { hp: null, attack: null, defense: null, spAttack: null, spDefense: null, speed: null }
      });
      continue;
    }

    let rawPokemonName = '';
    let rawAbility = '';
    let rawItem = '';
    const rawMoves: string[] = [];

    // Stat values placeholders
    let rawHp = '';
    let rawAttack = '';
    let rawDefense = '';
    let rawSpAttack = '';
    let rawSpDefense = '';
    let rawSpeed = '';

    const numberFields: RawOcrResultItem[] = [];
    const textFields: RawOcrResultItem[] = [];

    for (const item of slotResults) {
      const text = item.text.trim();
      if (!text) continue;

      const hasStatPrefix = /^(HP|Attack|Defense|Sp\.?\s*Atk|Sp\.?\s*Def|Speed|H|A|B|C|D|S)\s*[:：]?\s*\d+/i.test(text);
      const isMostlyDigits = /^\d+$/.test(text.replace(/[Iil|oOSBq\s]/g, '')) || hasStatPrefix;

      if (isMostlyDigits) {
        numberFields.push(item);
      } else {
        textFields.push(item);
      }
    }

    // --- Assign Stat Numbers ---
    const mappedStats = { hp: '', attack: '', defense: '', spAttack: '', spDefense: '', speed: '' };
    const unmappedNumbers: RawOcrResultItem[] = [];

    for (const numItem of numberFields) {
      const t = numItem.text.toLowerCase();
      if (t.includes('hp') || t.startsWith('h')) {
        mappedStats.hp = numItem.text;
      } else if (t.startsWith('a')) {
        mappedStats.attack = numItem.text;
      } else if (t.startsWith('b') || t.includes('def')) {
        if (t.includes('sp') || t.includes('c')) {
          // Skip sp
        } else {
          mappedStats.defense = numItem.text;
        }
      } else if (t.startsWith('c') || t.includes('sp.atk') || t.includes('satk')) {
        mappedStats.spAttack = numItem.text;
      } else if (t.startsWith('d') || t.includes('sp.def') || t.includes('sdef')) {
        mappedStats.spDefense = numItem.text;
      } else if (t.startsWith('s') || t.includes('speed')) {
        mappedStats.speed = numItem.text;
      } else {
        unmappedNumbers.push(numItem);
      }
    }

    if (unmappedNumbers.length > 0) {
      unmappedNumbers.sort((a, b) => a.y - b.y);
      const statKeys = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const;
      let keyIdx = 0;

      for (const numItem of unmappedNumbers) {
        while (keyIdx < statKeys.length && mappedStats[statKeys[keyIdx]]) {
          keyIdx++;
        }
        if (keyIdx < statKeys.length) {
          mappedStats[statKeys[keyIdx]] = numItem.text;
          keyIdx++;
        }
      }
    }

    rawHp = mappedStats.hp;
    rawAttack = mappedStats.attack;
    rawDefense = mappedStats.defense;
    rawSpAttack = mappedStats.spAttack;
    rawSpDefense = mappedStats.spDefense;
    rawSpeed = mappedStats.speed;

    // --- Assign Text Fields (Fuzzy Matching heuristic) ---
    for (const item of textFields) {
      const text = item.text.trim();
      if (text.length < 2) continue;

      let matchedType: 'pokemon' | 'ability' | 'item' | 'move' | null = null;
      let minDistance = 999;

      // Pokémon match
      for (const pName of pokemonList) {
        const limit = pName.length <= 2 ? 1 : 2;
        const d = levenshtein(text, pName);
        if (d <= limit && d < minDistance) {
          minDistance = d;
          matchedType = 'pokemon';
        }
      }

      // Ability match
      for (const abName of abilityList) {
        const limit = abName.length <= 2 ? 1 : 2;
        const d = levenshtein(text, abName);
        if (d <= limit && d < minDistance) {
          minDistance = d;
          matchedType = 'ability';
        }
      }

      // Item match
      for (const itName of itemList) {
        const limit = itName.length <= 3 ? 1 : 2;
        const d = levenshtein(text, itName);
        if (d <= limit && d < minDistance) {
          minDistance = d;
          matchedType = 'item';
        }
      }

      // Move match
      for (const mvName of moveList) {
        const limit = mvName.length <= 3 ? 1 : 2;
        const d = levenshtein(text, mvName);
        if (d <= limit && d < minDistance) {
          minDistance = d;
          matchedType = 'move';
        }
      }

      if (matchedType === 'pokemon' && !rawPokemonName) {
        rawPokemonName = text;
      } else if (matchedType === 'ability' && !rawAbility) {
        rawAbility = text;
      } else if (matchedType === 'item' && !rawItem) {
        rawItem = text;
      } else if (matchedType === 'move' && rawMoves.length < 4) {
        if (!rawMoves.includes(text)) {
          rawMoves.push(text);
        }
      }
    }

    const unassigned = textFields.filter(f => 
      f.text !== rawPokemonName && 
      f.text !== rawAbility && 
      f.text !== rawItem && 
      !rawMoves.includes(f.text)
    );

    while (rawMoves.length < 4 && unassigned.length > 0) {
      const candidate = unassigned.shift()!;
      rawMoves.push(candidate.text);
    }

    const rawData: RawOCRData = {
      pokemonName: rawPokemonName || (unassigned.length > 0 ? unassigned.shift()!.text : ''),
      ability: rawAbility || (unassigned.length > 0 ? unassigned.shift()!.text : ''),
      item: rawItem || (unassigned.length > 0 ? unassigned.shift()!.text : ''),
      moves: rawMoves,
      stats: {
        hp: rawHp,
        attack: rawAttack,
        defense: rawDefense,
        spAttack: rawSpAttack,
        spDefense: rawSpDefense,
        speed: rawSpeed,
      }
    };

    const dicts = {
      pokemon: pokemonList,
      abilities: abilityList,
      items: itemList,
      moves: moveList,
    };

    processedList.push(fuzzyMatchPokemonData(rawData, dicts));
  }

  return processedList;
}

// Simple Levenshtein distance helper
function levenshtein(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) tmp[i] = [i];
  for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + cost);
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Automatically estimates grid columns and rows based on Pokémon name anchor positions.
 */
export function estimateGridLayout(
  results: RawOcrResultItem[],
  imgWidth: number,
  imgHeight: number,
  pokemonList: string[]
): { cols: number; rows: number } {
  let cols = 2;
  let rows = 3;

  if (imgWidth > 0 && imgHeight > 0) {
    const anchors: RawOcrResultItem[] = [];
    for (const item of results) {
      const text = item.text.trim();
      if (text.length < 2) continue;
      for (const pName of pokemonList) {
        const limit = pName.length <= 2 ? 1 : 2;
        if (levenshtein(text, pName) <= limit) {
          anchors.push(item);
          break;
        }
      }
    }

    if (anchors.length >= 2) {
      const xCoords = anchors.map(a => a.x + a.w / 2).sort((a, b) => a - b);
      const xGroups: number[][] = [[xCoords[0]]];
      for (let i = 1; i < xCoords.length; i++) {
        const lastGroup = xGroups[xGroups.length - 1];
        const lastVal = lastGroup[lastGroup.length - 1];
        if (xCoords[i] - lastVal > imgWidth * 0.12) {
          xGroups.push([xCoords[i]]);
        } else {
          lastGroup.push(xCoords[i]);
        }
      }
      
      const yCoords = anchors.map(a => a.y + a.h / 2).sort((a, b) => a - b);
      const yGroups: number[][] = [[yCoords[0]]];
      for (let i = 1; i < yCoords.length; i++) {
        const lastGroup = yGroups[yGroups.length - 1];
        const lastVal = lastGroup[lastGroup.length - 1];
        if (yCoords[i] - lastVal > imgHeight * 0.12) {
          yGroups.push([yCoords[i]]);
        } else {
          lastGroup.push(yCoords[i]);
        }
      }

      cols = xGroups.length;
      rows = yGroups.length;

      if (cols * rows < 2) {
        cols = 2;
        rows = 3;
      }
    }
  }

  return { cols, rows };
}

/**
 * Main entry point to analyze a Pokemon status screen screenshot file.
 * Returns raw text boxes and the original image size.
 */
export async function analyzePokemonImage(imageFile: File | Blob): Promise<OcrAnalysisResponse> {
  await initOCRWorker();

  if (!ocrWorker) {
    throw new Error('OCR Worker failed to initialize.');
  }

  // Create ImageBitmap from File/Blob to transfer to Worker efficiently
  const bitmap = await createImageBitmap(imageFile);
  const width = bitmap.width;
  const height = bitmap.height;

  return new Promise((resolve, reject) => {
    const handleMessage = async (e: MessageEvent) => {
      const { type, results, error } = e.data;
      if (type === 'result') {
        ocrWorker!.removeEventListener('message', handleMessage);
        if (error) {
          reject(new Error(error));
        } else {
          resolve({
            results,
            width,
            height
          });
        }
      }
    };

    ocrWorker!.addEventListener('message', handleMessage);
    
    // Transfer ownership of bitmap memory to the worker
    ocrWorker!.postMessage({ type: 'analyze', bitmap }, [bitmap]);
  });
}
