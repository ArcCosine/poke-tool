const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '../data/pokemon_master.json');
const outputDir = path.join(__dirname, '../../public/assets/pokemon-sprites');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pokemonList = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadImage(id, attempt = 1) {
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  const dest = path.join(outputDir, `${id}.png`);

  if (fs.existsSync(dest)) {
    return { status: 'skipped' };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return { status: 'downloaded' };
  } catch (err) {
    if (attempt < 3) {
      await delay(2000);
      return downloadImage(id, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  console.log(`Starting download of ${pokemonList.length} pokemon sprites...`);
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < pokemonList.length; i++) {
    const poke = pokemonList[i];
    try {
      const result = await downloadImage(poke.id);
      if (result.status === 'downloaded') {
        downloaded++;
      } else {
        skipped++;
      }
      await delay(25); // 25ms delay (fast but safe)
    } catch (err) {
      console.error(`Failed to download sprite for ID ${poke.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`Done! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
