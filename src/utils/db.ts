const DB_NAME = 'PokeToolDB';
const DB_VERSION = 1;
const STORE_NAME = 'master_data';

export interface PokemonMaster {
  id: number;
  name: { ja: string; en: string };
  types: string[];
  base_stats: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
  abilities: { ja: string; en: string }[];
  regulations: string[];
  learnable_moves: number[];
}

export interface MoveMaster {
  id: number;
  name: { ja: string; en: string };
  type: string;
  category: string;
  power: number;
  accuracy: number;
  pp: number;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

export async function setCachedData(key: string, data: unknown): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to cache data to IndexedDB:', err);
  }
}

export async function loadMasterData(): Promise<{
  pokemon: PokemonMaster[];
  moves: MoveMaster[];
}> {
  // 1. Try loading from IndexedDB cache
  const cachedPokemon =
    await db.getCachedData<PokemonMaster[]>('pokemon_master');
  const cachedMoves = await db.getCachedData<MoveMaster[]>('moves_master');

  if (cachedPokemon && cachedMoves) {
    return { pokemon: cachedPokemon, moves: cachedMoves };
  }

  // 2. Fetch from static JSON files
  // Using relative path to be resolved by Cloudflare Pages/Vite
  const resPokemon = await fetch('/src/data/pokemon_master.json');
  const resMoves = await fetch('/src/data/moves_master.json');

  if (!resPokemon.ok || !resMoves.ok) {
    throw new Error('Failed to fetch master data from static assets');
  }

  const pokemon = await resPokemon.json();
  const moves = await resMoves.json();

  // 3. Cache to IndexedDB asynchronously
  if (pokemon.length > 0 && moves.length > 0) {
    // Fire and forget caching to not block main thread
    db.setCachedData('pokemon_master', pokemon).catch(console.error);
    db.setCachedData('moves_master', moves).catch(console.error);
  }

  return { pokemon, moves };
}

export const db = {
  initDB,
  getCachedData,
  setCachedData,
  loadMasterData,
};
