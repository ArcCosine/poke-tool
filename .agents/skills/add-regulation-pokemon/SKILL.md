---
name: add-regulation-pokemon
description: >-
  Use this skill whenever new Pokémon are added to Pokémon Champions through a new regulation
  or update, to verify their learnable moves, integrate them into the damage and durability rankings,
  and sync master data and cache versions.
---

# Add Regulation Pokémon to Rankings Skill

This skill automates the process of validating newly added regulation Pokémon, ensuring all forms (including Mega Evolutions and form variants) have their learnable moves populated, verifying that they appear in the damage and durability rankings, and syncing master data and version caches.

## When to Use
- Whenever a new regulation (e.g., M-C, M-D) is introduced.
- Whenever new Pokémon, Mega Evolutions, or form variants are added to `pokemon_master.json`.
- Whenever Pokémon have missing learnable moves or fail to appear in ranking lists (`StatSearch.tsx`).

## Workflow Steps

### Step 1: Run the Verification & Sync Script
Execute the helper script to detect any Pokémon with empty `learnable_moves` and automatically inherit them from their base species (e.g. Mega Absol Z from Absol):

```bash
npx tsx .agents/skills/add-regulation-pokemon/scripts/verify_and_sync_ranking_data.ts
```

This script will:
1. Scan `public/data/pokemon_master.json`.
2. Populate `learnable_moves` for any Mega Evolutions or regional variants missing move data.
3. Automatically increment `version.json` with a fresh timestamp so client IndexedDB caches are invalidated.

### Step 2: Verify Ranking Calculations
Run the ranking tests to ensure all Pokémon in master data produce valid damage and durability indices:

```bash
npx vitest run src/utils/calculator.test.ts
```

### Step 3: Verify StatSearch Ranking UI
Run the StatSearch UI tests to confirm that all Pokémon are displayed without regulation-based restrictions:

```bash
npx vitest run src/components/StatSearch/StatSearch.test.tsx
```

### Step 4: Build and Deploy
Ensure build passes and deploy updated assets:

```bash
npm run build
npm run deploy
```
