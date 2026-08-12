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

export interface ItemMaster {
  id: number;
  name: { ja: string; en: string };
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
  items: ItemMaster[];
}> {
  // 1. Fetch current data version
  let currentVersion = 0;
  try {
    const resVersion = await fetch('/src/data/version.json');
    if (resVersion.ok) {
      const versionData = await resVersion.json();
      currentVersion = versionData.version || 0;
    }
  } catch (err) {
    console.warn('Failed to fetch master data version:', err);
  }

  // 2. Try loading from IndexedDB cache and check version
  const cachedVersion = await db.getCachedData<number>('master_version');
  const cachedPokemon =
    await db.getCachedData<PokemonMaster[]>('pokemon_master');
  const cachedMoves = await db.getCachedData<MoveMaster[]>('moves_master');
  const cachedItems = await db.getCachedData<ItemMaster[]>('items_master');

  if (cachedVersion && cachedVersion === currentVersion && cachedPokemon && cachedMoves && cachedItems) {
    return { pokemon: cachedPokemon, moves: cachedMoves, items: cachedItems };
  }

  // 3. Fetch from static JSON files
  const resPokemon = await fetch('/src/data/pokemon_master.json');
  const resMoves = await fetch('/src/data/moves_master.json');
  const resItems = await fetch('/src/data/items_master.json');

  if (!resPokemon.ok || !resMoves.ok || !resItems.ok) {
    throw new Error('Failed to fetch master data from static assets');
  }

  const pokemon = await resPokemon.json();
  const moves = await resMoves.json();
  const items = await resItems.json();

  // 4. Cache to IndexedDB asynchronously
  if (pokemon.length > 0 && moves.length > 0 && items.length > 0) {
    db.setCachedData('pokemon_master', pokemon).catch(console.error);
    db.setCachedData('moves_master', moves).catch(console.error);
    db.setCachedData('items_master', items).catch(console.error);
    db.setCachedData('master_version', currentVersion).catch(console.error);
  }

  return { pokemon, moves, items };
}


export const db = {
  initDB,
  getCachedData,
  setCachedData,
  loadMasterData,
};
