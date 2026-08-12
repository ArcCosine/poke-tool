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
let regConfig: any = { except_ids: [], regulations: {} };
if (fs.existsSync(REG_CONFIG_PATH)) {
  regConfig = JSON.parse(fs.readFileSync(REG_CONFIG_PATH, 'utf-8'));
}

// Scrape available pokemon IDs from GameWith
async function scrapeTargetPokemonIds(): Promise<number[]> {
  const url = 'https://gamewith.jp/pokemon-champions/546414';
  try {
    console.log(`Scraping GameWith page for available pokemons: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch GameWith: ${response.statusText}`);
    }
    const html = await response.text();
    const regex = /no:'(\d+)'/g;
    const ids = new Set<number>();
    let match: RegExpExecArray | null;
    
    // Use loop to find all matches
    while (true) {
      match = regex.exec(html);
      if (match === null) break;
      const id = parseInt(match[1], 10);
      if (id > 0) {
        ids.add(id);
      }
    }
    
    const idList = Array.from(ids).sort((a, b) => a - b);
    console.log(`Successfully scraped ${idList.length} unique pokemon IDs from GameWith.`);
    return idList;
  } catch (error) {
    console.error('Failed to scrape pokemon IDs from GameWith, falling back to default list:', error);
    return [
      1, 3, 4, 6, 9, 25, 130, 143, 149, 150, 197, 212, 248, 257, 282, 373, 376, 
      382, 384, 445, 448, 479, 483, 484, 485, 635, 645, 700, 778, 887, 985, 987, 
      1004, 1007, 1008
    ];
  }
}

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
  // 1. Global exclusion check
  if (regConfig.except_ids && regConfig.except_ids.includes(id)) {
    return false;
  }

  const regs = Object.keys(regConfig.regulations);
  const targetIndex = regs.indexOf(regName);
  if (targetIndex === -1) return false;

  // 2. Collect pokemon IDs that are added in subsequent regulations (future additions relative to targetIndex)
  const futureNewPokemonIds = new Set<number>();
  for (let i = targetIndex + 1; i < regs.length; i++) {
    const rName = regs[i];
    const newIds = regConfig.regulations[rName].new_pokemon_ids || [];
    for (const newId of newIds) {
      futureNewPokemonIds.add(newId);
    }
  }

  // 3. Allowed if not in future release pool
  return !futureNewPokemonIds.has(id);
}

// Main execution
async function main() {
  console.log('Starting PokeAPIクローラー...');

  const targetPokemonIds = await scrapeTargetPokemonIds();
  const pokemonList: any[] = [];
  const movesMap: Map<number, any> = new Map();

  for (const id of targetPokemonIds) {
    try {
      // 1. Fetch species for Japanese and English names
      const speciesData = await fetchWithCache(
        `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
        `species_${id}`
      );
      if (!speciesData) continue;
      
      const baseJaName = speciesData.names.find((n: any) => n.language.name === 'ja')?.name || speciesData.name;
      const baseEnName = speciesData.names.find((n: any) => n.language.name === 'en')?.name || speciesData.name;

      // 2. Loop through all varieties to handle both base forms and mega forms
      for (const variety of speciesData.varieties) {
        const isDefault = variety.is_default;
        const varietyName = variety.pokemon.name;
        const isMega = varietyName.includes('-mega');

        // Skip non-default forms that are not mega evolutions (e.g., Gmax, custom forms)
        if (!isDefault && !isMega) {
          continue;
        }

        const pokemonUrl = variety.pokemon.url;
        // Extract pokemon ID from url
        const pokemonIdMatch = pokemonUrl.match(/\/pokemon\/(\d+)\//);
        if (!pokemonIdMatch) continue;
        const pokemonId = parseInt(pokemonIdMatch[1], 10);

        // Fetch pokemon details
        const pokemonData = await fetchWithCache(
          pokemonUrl,
          `pokemon_${pokemonId}`
        );
        if (!pokemonData) continue;

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

        // Extract learnable moves
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
                const power = moveDetails.power || 0;
                const accuracy = moveDetails.accuracy || 100;
                const pp = moveDetails.pp || 0;
                const jaMove = moveDetails.names.find((n: any) => n.language.name === 'ja')?.name || moveDetails.name;
                const enMove = moveDetails.names.find((n: any) => n.language.name === 'en')?.name || moveDetails.name;

                movesMap.set(moveId, {
                  id: moveId,
                  name: { ja: jaMove, en: enMove },
                  type: moveDetails.type.name,
                  category: moveDetails.damage_class.name,
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

        // Determine names for mega evolution
        let jaName = baseJaName;
        let enName = baseEnName;
        if (isMega) {
          if (varietyName.endsWith('-mega-x')) {
            jaName = `メガ${baseJaName}X`;
            enName = `Mega ${baseEnName} X`;
          } else if (varietyName.endsWith('-mega-y')) {
            jaName = `メガ${baseJaName}Y`;
            enName = `Mega ${baseEnName} Y`;
          } else {
            jaName = `メガ${baseJaName}`;
            enName = `Mega ${baseEnName}`;
          }
        }

        // Determine regulations
        // Both default and mega forms inherit the regulations of the base national dex ID.
        const regulations: string[] = [];
        for (const regName of Object.keys(regConfig.regulations)) {
          if (checkRegulation(id, regName)) {
            regulations.push(regName);
          }
        }


        pokemonList.push({
          id: pokemonId,
          name: { ja: jaName, en: enName },
          types,
          base_stats: baseStats,
          abilities,
          regulations,
          learnable_moves: learnableMoves,
        });

        console.log(`Saved: ${jaName} (${enName}) [ID: ${pokemonId}]`);
      }
    } catch (err) {
      console.error(`Error processing Pokémon ID ${id}:`, err);
    }
  }

  // 4. Save JSON database files
  const pokemonMasterPath = path.join(DATA_DIR, 'pokemon_master.json');
  const movesMasterPath = path.join(DATA_DIR, 'moves_master.json');
  const versionPath = path.join(DATA_DIR, 'version.json');

  fs.writeFileSync(pokemonMasterPath, JSON.stringify(pokemonList, null, 2), 'utf-8');
  fs.writeFileSync(movesMasterPath, JSON.stringify(Array.from(movesMap.values()), null, 2), 'utf-8');
  fs.writeFileSync(versionPath, JSON.stringify({ version: Date.now() }, null, 2), 'utf-8');

  console.log(`Finished! Total Pokémon: ${pokemonList.length}, Total Moves: ${movesMap.size}`);
}

main().catch((err) => {
  console.error('Fatal error in crawler:', err);
  process.exit(1);
});
