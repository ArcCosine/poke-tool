import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');

interface PokemonMaster {
  id: number;
  name: { ja: string; en: string; [key: string]: string | undefined };
  types: string[];
  base_stats: {
    hp: number;
    attack: number;
    defense: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
  abilities: { ja: string; en: string; [key: string]: string | undefined }[];
  regulations: string[];
  learnable_moves: number[];
}

// Map of mega/form variants to their base pokemon IDs
const BASE_POKEMON_MAP: Record<number, number> = {
  10307: 359, // メガアブソルZ -> アブソル
  10309: 445, // メガガブリアスZ -> ガブリアス
  10310: 448, // メガルカリオZ -> ルカリオ
  10327: 768, // メガグソクムシャ -> グソクムシャ
  10328: 998, // メガセグレイブ -> セグレイブ
};

export function syncAndVerifyRankingData(): {
  updatedCount: number;
  totalPokemons: number;
  errors: string[];
} {
  const publicPokemonPath = path.join(
    rootDir,
    'public/data/pokemon_master.json'
  );
  const srcPokemonPath = path.join(rootDir, 'src/data/pokemon_master.json');
  const publicVersionPath = path.join(rootDir, 'public/data/version.json');
  const srcVersionPath = path.join(rootDir, 'src/data/version.json');

  const pokes: PokemonMaster[] = JSON.parse(
    fs.readFileSync(publicPokemonPath, 'utf8')
  );

  let updatedCount = 0;
  const errors: string[] = [];

  for (const poke of pokes) {
    if (!poke.learnable_moves || poke.learnable_moves.length === 0) {
      // Find base pokemon ID from mapping
      let baseId = BASE_POKEMON_MAP[poke.id];

      // Fallback: search by name (e.g. メガXXX -> XXX)
      if (!baseId && poke.name.ja.startsWith('メガ')) {
        const baseName = poke.name.ja
          .replace(/^メガ/, '')
          .replace(/[XYZ]$/, '');
        const basePoke = pokes.find(
          (p) =>
            p.name.ja === baseName &&
            p.learnable_moves &&
            p.learnable_moves.length > 0
        );
        if (basePoke) {
          baseId = basePoke.id;
        }
      }

      if (baseId) {
        const basePoke = pokes.find((p) => p.id === baseId);
        if (
          basePoke &&
          basePoke.learnable_moves &&
          basePoke.learnable_moves.length > 0
        ) {
          poke.learnable_moves = [...basePoke.learnable_moves];
          updatedCount++;
          console.log(
            `[SYNC] Inherited ${poke.learnable_moves.length} moves for ${poke.name.ja} (ID: ${poke.id}) from ${basePoke.name.ja} (ID: ${baseId})`
          );
        } else {
          errors.push(
            `Base pokemon with ID ${baseId} for ${poke.name.ja} not found or has no moves.`
          );
        }
      } else {
        errors.push(
          `No base pokemon found for ${poke.name.ja} (ID: ${poke.id}) with 0 learnable moves.`
        );
      }
    }
  }

  if (updatedCount > 0) {
    const formatted = `${JSON.stringify(pokes, null, 2)}\n`;
    fs.writeFileSync(publicPokemonPath, formatted, 'utf8');
    fs.writeFileSync(srcPokemonPath, formatted, 'utf8');

    const newVersion = Date.now();
    const versionContent = `${JSON.stringify({ version: newVersion }, null, 2)}\n`;
    fs.writeFileSync(publicVersionPath, versionContent, 'utf8');
    fs.writeFileSync(srcVersionPath, versionContent, 'utf8');
    console.log(`[SYNC] Updated version.json to ${newVersion}`);
  }

  return {
    updatedCount,
    totalPokemons: pokes.length,
    errors,
  };
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = syncAndVerifyRankingData();
  console.log('Result:', result);
  if (result.errors.length > 0) {
    console.error('Errors encountered:', result.errors);
    process.exit(1);
  }
}
