import fs from 'node:fs';
import path from 'node:path';

// Target directory paths
const DATA_DIR = path.resolve(import.meta.dirname, '../src/data');
const CACHE_DIR = path.resolve(import.meta.dirname, './cache');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Regulations config path
const REG_CONFIG_PATH = path.resolve(import.meta.dirname, './regulations_config.json');
let regConfig: any = { "M-A": { "allow_all": true, "except_ids": [] }, "M-B": { "max_generation": 4 } };
if (fs.existsSync(REG_CONFIG_PATH)) {
  regConfig = JSON.parse(fs.readFileSync(REG_CONFIG_PATH, 'utf-8'));
}

// Major Pokémon IDs for high-fidelity master data (approx. 35 popular competitive mons)
const TARGET_POKEMON_IDS = [
  1, 3, 4, 6, 9, 25, 130, 143, 149, 150, 197, 212, 248, 257, 282, 373, 376, 
  382, 384, 445, 448, 479, 483, 484, 485, 635, 645, 700, 778, 887, 985, 987, 
  1004, 1007, 1008
];

// Helper to delay requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cache-wrapped fetcher
async function fetchWithCache(url: string, cacheName: string): Promise<any> {
  const cacheFile = path.join(CACHE_DIR, `${cacheName}.json`);
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  }

  console.log(`Fetching from API: ${url}`);
  await delay(100); // 100ms throttle to prevent server overload
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

// Determine generation from ID
function getGeneration(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 898) return 8;
  return 9;
}

// Determine if Pokémon matches regulation
function checkRegulation(id: number, regName: string): boolean {
  const rules = regConfig[regName];
  if (!rules) return false;

  if (rules.allow_all) {
    if (rules.except_ids && rules.except_ids.includes(id)) {
      return false;
    }
    return true;
  }

  if (rules.allow_ids && rules.allow_ids.includes(id)) {
    return true;
  }

  if (rules.max_generation) {
    const gen = getGeneration(id);
    return gen <= rules.max_generation;
  }

  return false;
}

// Main execution
async function main() {
  console.log('Starting PokeAPIクローラー...');

  const pokemonList: any[] = [];
  const movesMap: Map<number, any> = new Map();

  for (const id of TARGET_POKEMON_IDS) {
    try {
      // 1. Fetch species for Japanese and English names
      const speciesData = await fetchWithCache(
        `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
        `species_${id}`
      );
      
      const jaName = speciesData.names.find((n: any) => n.language.name === 'ja')?.name || speciesData.name;
      const enName = speciesData.names.find((n: any) => n.language.name === 'en')?.name || speciesData.name;

      // 2. Fetch pokemon stats, types, abilities, and moves
      const pokemonData = await fetchWithCache(
        `https://pokeapi.co/api/v2/pokemon/${id}/`,
        `pokemon_${id}`
      );

      const types = pokemonData.types.map((t: any) => t.type.name);

      const baseStats = {
        hp: pokemonData.stats.find((s: any) => s.stat.name === 'hp').base_stat,
        attack: pokemonData.stats.find((s: any) => s.stat.name === 'attack').base_stat,
        defense: pokemonData.stats.find((s: any) => s.stat.name === 'defense').base_stat,
        sp_attack: pokemonData.stats.find((s: any) => s.stat.name === 'special-attack').base_stat,
        sp_defense: pokemonData.stats.find((s: any) => s.stat.name === 'special-defense').base_stat,
        speed: pokemonData.stats.find((s: any) => s.stat.name === 'speed').base_stat,
      };

      const abilities: any[] = [];
      for (const a of pokemonData.abilities) {
        // Fetch ability details to get Japanese/English names
        const abilityDetails = await fetchWithCache(
          a.ability.url,
          `ability_${a.ability.name}`
        );
        const jaAbility = abilityDetails.names.find((n: any) => n.language.name === 'ja')?.name || a.ability.name;
        const enAbility = abilityDetails.names.find((n: any) => n.language.name === 'en')?.name || a.ability.name;
        abilities.push({ ja: jaAbility, en: enAbility });
      }

      // 3. Extract learnable moves (top 15 moves for simplicity and file size)
      const learnableMoves: number[] = [];
      const movesToFetch = pokemonData.moves.slice(0, 15);

      for (const m of movesToFetch) {
        const moveUrl = m.move.url;
        const moveId = parseInt(moveUrl.split('/').filter(Boolean).pop() || '0', 10);
        
        if (moveId > 0) {
          learnableMoves.push(moveId);

          if (!movesMap.has(moveId)) {
            // Fetch move details
            try {
              const moveDetails = await fetchWithCache(moveUrl, `move_${moveId}`);
              // Some moves might lack power (status moves)
              const power = moveDetails.power || 0;
              const accuracy = moveDetails.accuracy || 100;
              const pp = moveDetails.pp || 0;
              const jaMove = moveDetails.names.find((n: any) => n.language.name === 'ja')?.name || moveDetails.name;
              const enMove = moveDetails.names.find((n: any) => n.language.name === 'en')?.name || moveDetails.name;

              movesMap.set(moveId, {
                id: moveId,
                name: { ja: jaMove, en: enMove },
                type: moveDetails.type.name,
                category: moveDetails.damage_class.name, // physical, special, status
                power,
                accuracy,
                pp,
              });
            } catch (err) {
              console.error(`Failed to fetch move ${moveId}:`, err);
            }
          }
        }
      }

      // Check regulations
      const regulations: string[] = [];
      if (checkRegulation(id, 'M-A')) regulations.push('M-A');
      if (checkRegulation(id, 'M-B')) regulations.push('M-B');

      pokemonList.push({
        id,
        name: { ja: jaName, en: enName },
        types,
        base_stats: baseStats,
        abilities,
        regulations,
        learnable_moves: learnableMoves,
      });

      console.log(`Saved: ${jaName} (${enName})`);
    } catch (err) {
      console.error(`Error processing Pokémon ${id}:`, err);
    }
  }

  // 4. Save JSON database files
  const pokemonMasterPath = path.join(DATA_DIR, 'pokemon_master.json');
  const movesMasterPath = path.join(DATA_DIR, 'moves_master.json');

  fs.writeFileSync(pokemonMasterPath, JSON.stringify(pokemonList, null, 2), 'utf-8');
  fs.writeFileSync(movesMasterPath, JSON.stringify(Array.from(movesMap.values()), null, 2), 'utf-8');

  console.log(`Finished! Total Pokémon: ${pokemonList.length}, Total Moves: ${movesMap.size}`);
}

main().catch((err) => {
  console.error('Fatal error in crawler:', err);
  process.exit(1);
});
