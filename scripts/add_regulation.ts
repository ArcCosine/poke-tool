import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REGULATIONS_JSON_PATH = path.resolve(import.meta.dirname, '../src/data/regulations.json');
const CONFIG_JSON_PATH = path.resolve(import.meta.dirname, './regulations_config.json');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: npx tsx scripts/add_regulation.ts <id> <name_ja> <name_en> [new_pokemon_ids_comma_separated]');
    console.error('Example: npx tsx scripts/add_regulation.ts M-C "レギュレーションM-C" "Regulation M-C" 979,1000');
    process.exit(1);
  }

  const [id, nameJa, nameEn, pokemonIdsStr] = args;
  const newPokemonIds = pokemonIdsStr
    ? pokemonIdsStr.split(',').map(idStr => parseInt(idStr.trim(), 10)).filter(num => !isNaN(num))
    : [];

  // 1. Update src/data/regulations.json
  let regulations: any[] = [];
  if (fs.existsSync(REGULATIONS_JSON_PATH)) {
    regulations = JSON.parse(fs.readFileSync(REGULATIONS_JSON_PATH, 'utf-8'));
  }

  const existingRegIndex = regulations.findIndex(r => r.id === id);
  const newRegData = {
    id,
    name: {
      ja: nameJa,
      en: nameEn
    }
  };

  if (existingRegIndex >= 0) {
    regulations[existingRegIndex] = newRegData;
    console.log(`Updated existing regulation in regulations.json: ${id}`);
  } else {
    regulations.push(newRegData);
    console.log(`Added new regulation to regulations.json: ${id}`);
  }
  fs.writeFileSync(REGULATIONS_JSON_PATH, JSON.stringify(regulations, null, 2), 'utf-8');

  // 2. Update scripts/regulations_config.json
  let config: any = { except_ids: [], regulations: {} };
  if (fs.existsSync(CONFIG_JSON_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_JSON_PATH, 'utf-8'));
  }

  config.regulations[id] = {
    description: `Regulation ${id}: Added new Pokémon.`,
    new_pokemon_ids: newPokemonIds
  };
  fs.writeFileSync(CONFIG_JSON_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`Updated regulations_config.json for: ${id}`);

  // 3. Run master data update
  console.log('Running master data update...');
  try {
    execSync('npm run update-data', { stdio: 'inherit', cwd: path.resolve(import.meta.dirname, '..') });
    console.log('Successfully updated master data.');
  } catch (error) {
    console.error('Failed to update master data:', error);
    process.exit(1);
  }
}

main();
